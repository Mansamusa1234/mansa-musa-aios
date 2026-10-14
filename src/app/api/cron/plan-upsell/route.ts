import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";
import { priceEnv } from "@/lib/stripePrices";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";
const STARTER_PRICE = priceEnv("STRIPE_PRICE_STARTER", "STRIPE_PRICE_BASIC");

export const GET = withCron(async () => {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const starterSubs = await db.subscription.findMany({
    where: {
      status: "ACTIVE",
      stripePriceId: STARTER_PRICE || undefined,
      currentPeriodStart: { lte: cutoff },
      planUpsellSentAt: null,
    } as never,
    include: { user: true },
    take: 30,
  });

  let sent = 0;

  for (const sub of starterSubs) {
    const { user } = sub;
    if (!user.email) continue;
    const name = user.name ?? "there";
    const upgradeUrl = `${APP}/billing`;

    await sendEmail(
      user.email,
      `${name}, you're leaving money on the table`,
      `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#0a0a1a;color:#e2e8f0">
        <h2 style="color:#a78bfa;margin:0 0 16px">You're on Starter. Here's what you're missing.</h2>
        <p style="font-size:16px;line-height:1.7">Hey ${name},</p>
        <p style="font-size:16px;line-height:1.7">You've been on the Starter plan for 2 weeks. Here's what Professional adds for £100/month more:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr style="border-bottom:1px solid #1e293b">
            <td style="padding:10px 8px;color:#94a3b8">Feature</td>
            <td style="padding:10px 8px;text-align:center;color:#94a3b8">Starter (you)</td>
            <td style="padding:10px 8px;text-align:center;color:#a78bfa;font-weight:600">Professional</td>
          </tr>
          <tr style="border-bottom:1px solid #1e293b">
            <td style="padding:10px 8px">Email automation sequences</td>
            <td style="padding:10px 8px;text-align:center">No</td>
            <td style="padding:10px 8px;text-align:center;color:#4ade80;font-weight:600">Yes</td>
          </tr>
          <tr>
            <td style="padding:10px 8px">Business Research Desk</td>
            <td style="padding:10px 8px;text-align:center">No</td>
            <td style="padding:10px 8px;text-align:center;color:#4ade80;font-weight:600">Yes</td>
          </tr>
        </table>
        <a href="${upgradeUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;margin:8px 0">Upgrade to Professional</a>
        <p style="font-size:14px;color:#94a3b8;margin-top:32px">Darren Neil · Founder, MansaMusaAI<br>P.S. Upgrade is instant and prorated — you won't pay double.</p>
      </div>`
    );

    await db.subscription.update({
      where: { id: sub.id },
      data: { planUpsellSentAt: new Date() } as never,
    });
    sent++;
  }

  return { sent };
});
