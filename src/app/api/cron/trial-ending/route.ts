import { db } from "@/lib/db";
import { triggerWorkflows } from "@/lib/email-automation";
import { withCron } from "@/lib/cronUtils";

export const GET = withCron(async () => {
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

  return { notified };
});
