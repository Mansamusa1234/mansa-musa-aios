import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { inspectGitHubRepo } from "@/lib/repoIntelligence";
import { getAbacusRepoWorkerHealth } from "@/lib/abacusRepoWorker";
import { getVercelRepoStatus } from "@/lib/vercelRepoStatus";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;

  const body = await req.json().catch(() => ({})) as { repoUrl?: unknown };
  if (typeof body.repoUrl !== "string" || !body.repoUrl.trim()) {
    return NextResponse.json({ error: "A GitHub repository URL is required." }, { status: 400 });
  }

  try {
    const [inspection, abacus, vercel] = await Promise.all([
      inspectGitHubRepo(session.user.id, body.repoUrl),
      getAbacusRepoWorkerHealth(),
      getVercelRepoStatus(),
    ]);

    const browserInspection = {
      ...inspection,
      selectedFiles: inspection.selectedFiles.map((file) => ({ path: file.path })),
    };

    return NextResponse.json({
      ok: true,
      inspection: browserInspection,
      infrastructure: {
        github: {
          connected: inspection.access.authenticated,
          accessSource: inspection.access.source,
          privateRepository: inspection.repository.private,
        },
        abacus,
        vercel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repository inspection failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
