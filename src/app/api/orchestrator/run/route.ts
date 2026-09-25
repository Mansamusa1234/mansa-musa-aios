import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runSuperOrchestrator } from "@/lib/orchestrator/runner";
import { queueOrchestratorActions } from "@/lib/orchestrator/approvals";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  goal: z.string().trim().min(5).max(4000),
  context: z.string().max(15000).optional().default(""),
  useSupercomputer: z.boolean().optional().default(true),
  queueActions: z.boolean().optional().default(true),
  saveReport: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Super Orchestrator is currently admin-only." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid orchestration request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const run = await runSuperOrchestrator(parsed.data);

  let queuedActions = 0;
  if (parsed.data.queueActions && run.actions.length) {
    queuedActions = await queueOrchestratorActions({
      actions: run.actions,
      goal: parsed.data.goal,
      requestedBy: session.user.id,
    });
  }

  let savedReportId: string | null = null;
  if (parsed.data.saveReport) {
    const saved = await db.exportedDocument.create({
      data: {
        userId: session.user.id,
        title: `Super Orchestrator — ${parsed.data.goal.slice(0, 120)}`,
        type: "super_orchestrator_run",
        content: run.report,
        sources: JSON.stringify({
          architecture: run.architecture,
          taskEngines: run.tasks.map((task) => ({
            id: task.id,
            lane: task.lane,
            engine: task.result.engine,
            model: task.result.model || null,
            provider: task.result.provider || null,
          })),
        }),
      },
    });
    savedReportId = saved.id;
  }

  return NextResponse.json({
    ok: true,
    run,
    queuedActions,
    savedReportId,
  });
}
