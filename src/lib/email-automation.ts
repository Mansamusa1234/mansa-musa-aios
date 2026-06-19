import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { WorkflowTrigger } from "@prisma/client";

/**
 * Fire all active workflows matching this trigger for this user.
 * Enqueues a WorkflowRun at step 0; a background cron/job processes
 * delayed steps. For immediate steps (delayHours === 0) we send inline.
 * Never throws — all errors are logged.
 */
export async function triggerWorkflows(
  userId: string,
  trigger: WorkflowTrigger,
  recipient: { email: string; name?: string | null },
  vars: Record<string, string> = {},
): Promise<void> {
  try {
    const workflows = await db.emailWorkflow.findMany({
      where: { userId, trigger, isActive: true },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    for (const wf of workflows) {
      if (wf.steps.length === 0) continue;

      const run = await db.emailWorkflowRun.create({
        data: {
          workflowId: wf.id,
          toEmail: recipient.email,
          toName: recipient.name ?? null,
          status: "RUNNING",
          currentStep: 0,
        },
      });

      // Send any step with delayHours === 0 immediately
      for (const step of wf.steps) {
        if (step.delayHours > 0) break; // rest are deferred

        const subject = interpolate(step.subject, vars);
        const body    = interpolate(step.bodyHtml, vars);

        try {
          await sendEmail(recipient.email, subject, body);
        } catch (err) {
          console.error(`[email-automation] step ${step.id} send failed:`, err);
        }

        await db.emailWorkflowRun.update({
          where: { id: run.id },
          data: { currentStep: step.stepOrder + 1 },
        });
      }

      // Mark completed if all steps were immediate
      const hasDeferred = wf.steps.some((s) => s.delayHours > 0);
      if (!hasDeferred) {
        await db.emailWorkflowRun.update({
          where: { id: run.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }
    }
  } catch (err) {
    console.error("[email-automation] triggerWorkflows failed:", err);
  }
}

/** Process pending deferred steps — call this from a cron route (e.g. /api/cron/email-workflows). */
export async function processDeferredSteps(): Promise<void> {
  const runs = await db.emailWorkflowRun.findMany({
    where: { status: "RUNNING" },
    include: {
      workflow: {
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      },
    },
    take: 100,
  });

  for (const run of runs) {
    const steps = run.workflow.steps;
    const remaining = steps.filter((s) => s.stepOrder >= run.currentStep);

    for (const step of remaining) {
      const stepDueAt = new Date(run.startedAt.getTime() + step.delayHours * 3_600_000);
      if (stepDueAt > new Date()) break; // not yet due

      try {
        const vars = { name: run.toName ?? "there", email: run.toEmail };
        await sendEmail(run.toEmail, interpolate(step.subject, vars), interpolate(step.bodyHtml, vars));
      } catch (err) {
        console.error(`[email-automation] deferred step ${step.id} failed:`, err);
      }

      await db.emailWorkflowRun.update({
        where: { id: run.id },
        data: { currentStep: step.stepOrder + 1 },
      });
    }

    const allDone = steps.every((s) => s.stepOrder < run.currentStep);
    if (allDone) {
      await db.emailWorkflowRun.update({
        where: { id: run.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }
  }
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
