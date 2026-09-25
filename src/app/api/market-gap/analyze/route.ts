import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { MODEL_CATALOG, routeMessage, type ModelDef } from "@/lib/modelRouter";
import { runAbacusMarketGapResearch } from "@/lib/abacusMarketGapWorker";

async function chooseFallbackModel(): Promise<ModelDef | null> {
  const order = [
    "gpt-5.5",
    "gpt-5.4",
    "claude-sonnet-4-6",
    "gemini-2.5-pro",
    "grok-3",
    "gpt-4.1",
  ];

  for (const id of order) {
    const model = MODEL_CATALOG.find((item) => item.modelId === id && item.available());
    if (model) return model;
  }
  return MODEL_CATALOG.find((item) => item.available()) ?? null;
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

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.arena, session.user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const projectName = clean(body.projectName, 160);
  const idea = clean(body.idea, 8000);
  const customers = clean(body.customers, 4000);
  const problem = clean(body.problem, 4000);
  const market = clean(body.market, 1000) || "Global";
  const goal = clean(body.goal, 2000) || "Find the strongest commercially testable market gap";
  const context = clean(body.context, 12000);
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 30)
    : clean(body.keywords, 1200).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);

  if (projectName.length < 2 || idea.length < 10 || customers.length < 2 || problem.length < 2) {
    return NextResponse.json(
      { error: "Project name, idea, target customers and problem are required." },
      { status: 400 }
    );
  }

  const research = await runAbacusMarketGapResearch({
    projectName,
    idea,
    customers,
    problem,
    market,
    goal,
    keywords,
    context: context || undefined,
  });

  if (research) {
    return NextResponse.json({
      ok: true,
      ...research,
    });
  }

  const fallback = await chooseFallbackModel();
  if (!fallback) {
    return NextResponse.json(
      {
        error: "Market Gap Intelligence is not connected to Abacus and no fallback AI model is configured.",
        code: "NO_RESEARCH_PROVIDER",
      },
      { status: 503 }
    );
  }

  const system = [
    "You are Mansa Musa AI Market Gap Intelligence in OFFLINE FALLBACK MODE.",
    "You do not have live web research in this request.",
    "Do not state current revenue, market share, pricing, social counts, view counts, rankings or competitor leadership as verified.",
    "Produce a useful strategy report but label current-market facts as REQUIRES LIVE VERIFICATION.",
    "Return Markdown with: Executive Summary, Buyers, Competitor Hypotheses, Market Gaps, Positioning, MVP, Validation Tests, Risks, Live Data Still Needed.",
  ].join("\n");

  const prompt = [
    "Project: " + projectName,
    "Idea: " + idea,
    "Customers: " + customers,
    "Problem: " + problem,
    "Market: " + market,
    "Goal: " + goal,
    keywords.length ? "Keywords: " + keywords.join(", ") : "",
    context ? "Context: " + context : "",
  ].filter(Boolean).join("\n\n");

  const routed = routeMessage(fallback, [{ role: "user", content: prompt }], system);
  const report = await collectStream(routed.stream);
  await routed.onComplete.catch(() => null);

  return NextResponse.json({
    ok: true,
    report,
    runId: null,
    liveSearch: false,
    source: "native-offline-fallback",
    warning: "Abacus live research is not connected, so current competitor and social metrics were not verified.",
  });
}
