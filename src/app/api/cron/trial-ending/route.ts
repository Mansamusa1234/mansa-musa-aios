import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerWorkflows } from "@/lib/email-automation";

// Runs daily. Finds trials expiring within 72 hours that haven't been notified,
// fires TRIAL_ENDING workflows, and marks them so we don't double-fire.
export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const in72h = new Date(now.getTime() + 72 * 3600 * 1000);

  const expiring = await db.subscription.findMany({
    where: {
      status: "TRIALING",
      trialEndsAt: { gt: now, lte: in72h },
      trialEndingNotifiedAt: null,
    },
    include: { user: { select: { id: true, email: true, name: true } } },
    take: 100,
  });

  let notified = 0;
  await Promise.all(
    expiring.map(async (sub) => {
      try {
        await triggerWorkflows(sub.userId, "TRIAL_ENDING", {
          email: sub.user.email,
          name: sub.user.name ?? "",
        });
        await db.subscription.update({
          where: { id: sub.id },
          data: { trialEndingNotifiedAt: new Date() },
        });
        notified++;
      } catch (err) {
        console.error("[cron/trial-ending] failed for", sub.userId, err);
      }
    })
  );

  return NextResponse.json({ ok: true, notified, timestamp: new Date().toISOString() });
}
