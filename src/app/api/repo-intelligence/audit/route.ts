import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { MODEL_CATALOG, routeMessage, type ModelDef } from "@/lib/modelRouter";
import { buildRepoAuditContext, inspectGitHubRepo } from "@/lib/repoIntelligence";
import { runAbacusRepoAudit } from "@/lib/abacusRepoWorker";

async function chooseNativeModel(userId: string): Promise<ModelDef | null> {
  const pref = await db.userModelPreference.findUnique({ where: { userId } });
  if (pref) {
    const preferred = MODEL_CATALOG.find(
      (model) => model.provider === pref.provider && model.modelId === pref.modelId && model.available()
    );
    if (preferred) return preferred;
  }

  const preferredOrder = [
    "claude-sonnet-5",
    "gpt-4.1",
    "gemini-2.5-pro",
    "grok-3",
    "claude-sonnet-4-6",
    "gpt-4o",
    "gemini-2.0-flash",
    "gpt-4o-mini",
  ];

  for (const id of preferredOrder) {
    const match = MODEL_CATALOG.find((model) => model.modelId === id && model.available());
    if (match) return match;
  }
  return MODEL_CATALOG.find((model) => model.available()) ?? null;
}

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
    if (output.length > 120000) break;
  }
  output += decoder.decode();
  return output.slice(0, 120000);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limited = await checkRateLimit(limiters.arena, session.user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => ({})) as { repoUrl?: unknown; focus?: unknown };
  if (typeof body.repoUrl !== "string" || !body.repoUrl.trim()) {
    return NextResponse.json({ error: "A GitHub repository URL is required." }, { status: 400 });
  }

  const focus = typeof body.focus === "string" ? body.focus.trim().slice(0, 1200) : "";

  try {
    const inspection = await inspectGitHubRepo(session.user.id, body.repoUrl);
    const context = buildRepoAuditContext(inspection);

    const abacus = await runAbacusRepoAudit({
      inspection,
      context,
      focus: focus || undefined,
    });

    if (abacus) {
      return NextResponse.json({
        ok: true,
        source: "abacus-supercomputer",
        runId: abacus.runId ?? null,
        report: abacus.report,
        repository: inspection.repository,
      });
    }

    const model = await chooseNativeModel(session.user.id);
    if (!model) {
      return NextResponse.json(
        {
          error: "Abacus is unavailable and no native AI provider is configured for fallback analysis.",
          code: "NO_ANALYSIS_PROVIDER",
        },
        { status: 503 }
      );
    }

    const system = [
      "You are Mansa Musa AI Repo Intelligence, a senior software architect, SRE, security reviewer and debugging engineer.",
      "Analyse only the repository context supplied by the server.",
      "Do not claim you inspected files that are not in the supplied context.",
      "Never ask for or expose credentials, private keys, API tokens, passwords or production secrets.",
      "Prioritise concrete findings over generic advice.",
      "Return a concise but substantial Markdown report with these sections:",
      "1. Executive summary",
      "2. Architecture map",
      "3. Build and deployment risks",
      "4. Authentication and security findings",
      "5. Broken, incomplete or suspicious implementation areas",
      "6. Performance and maintainability",
      "7. Exact files to inspect or change next",
      "8. Prioritised repair plan",
      "Clearly label uncertainty where the provided context is insufficient.",
    ].join("\n");

    const userMessage = [
      focus ? "Owner focus: " + focus : "Owner focus: full codebase audit",
      "",
      context,
    ].join("\n");

    const routed = routeMessage(model, [{ role: "user", content: userMessage }], system);
    const report = await collectStream(routed.stream);
    const usage = await routed.onComplete;

    if (!report.trim()) throw new Error("The native analysis model returned an empty report.");

    await db.usageRecord.create({
      data: {
        userId: session.user.id,
        model: usage.model,
        provider: usage.provider,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costUsdMicro: usage.costUsdMicro,
      },
    }).catch((error) => console.error("[repo-intelligence] usage record failed", error));

    return NextResponse.json({
      ok: true,
      source: "native-" + model.provider,
      model: model.displayName,
      runId: null,
      report,
      repository: inspection.repository,
    });
  } catch (error) {
    console.error("[repo-intelligence] audit failed", error);
    const message = error instanceof Error ? error.message : "Repository audit failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
