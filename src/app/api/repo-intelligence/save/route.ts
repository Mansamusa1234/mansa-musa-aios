import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseGitHubRepoUrl } from "@/lib/repoIntelligence";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as {
    repoUrl?: unknown;
    report?: unknown;
    source?: unknown;
  };

  if (typeof body.repoUrl !== "string" || typeof body.report !== "string") {
    return NextResponse.json({ error: "Repository URL and report are required." }, { status: 400 });
  }
  if (body.report.trim().length < 20 || body.report.length > 150000) {
    return NextResponse.json({ error: "Report length is invalid." }, { status: 400 });
  }

  try {
    const parsed = parseGitHubRepoUrl(body.repoUrl);
    const source = typeof body.source === "string" ? body.source.slice(0, 80) : "repo-intelligence";
    const title = "Repo Audit — " + parsed.owner + "/" + parsed.repo;

    const saved = await db.exportedDocument.create({
      data: {
        userId: session.user.id,
        title,
        type: "repo_intelligence",
        content: body.report,
        sources: JSON.stringify({
          repository: "https://github.com/" + parsed.owner + "/" + parsed.repo,
          analysisSource: source,
          savedAt: new Date().toISOString(),
        }),
      },
      select: { id: true, title: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the report.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
