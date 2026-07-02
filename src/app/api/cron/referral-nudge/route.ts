import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

export const GET = withCron(async () => {
  if (new Date().getDay() !== 4) return { skipped: "Not Thursday" };

  const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const users = await db.user.findMany({
    where: {
      subscription: { status: "ACTIVE" },
      createdAt: { lte: cutoff },
      referralNudgeSentAt: null,
      email: { not: null },
    } as never,
    include: { subscription: true },
    take: 50,
  });

  let sent = 0;
  for (const user of users) {
    if (!user.email) continue;
    const name = user.name ?? "there";
    const referralCode = (user as typeof user & { referralCode: string | null }).referralCode ?? "";
    const referralLink = referralCode ? `${APP}/register?ref=${referralCode}` : `${APP}/referrals`;

    await sendEmail(
      user.email,
      `${name}, know someone who could use this? Earn £30+/mo`,
      `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#0a0a1a;color:#e2e8f0">
        <h2 style="color:#a78bfa;margin:0 0 16px">Turn your network into income</h2>
        <p style="font-size:16px;line-height:1.7">Hey ${name},</p>
        <p style="font-size:16px;line-height:1.7">You've been using MansaMusaAI for a few weeks. If it's helping your business, I want to pay you to tell other people about it.</p>
        <div style="background:#1e1b4b;border:1px solid #7c3aed;padding:20px;border-radius:8px;margin:20px 0">
          <p style="font-size:18px;font-weight:700;color:#a78bfa;margin:0 0 12px">The deal:</p>
          <p style="margin:0;font-size:15px;line-height:1.8">
            Share your link with any business owner<br>
            They get 10% off their first 3 months<br>
            You earn <strong style="color:#4ade80">20% of their subscription every month</strong><br>
            As long as they stay subscribed, you keep earning<br>
            No limit on referrals
          </p>
        </div>
        <div style="background:#0f2a1a;padding:16px 20px;border-radius:8px;margin:20px 0">
          <p style="margin:0 0 4px;font-size:13px;color:#94a3b8">YOUR REFERRAL LINK</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#4ade80;word-break:break-all">${referralLink}</p>
        </div>
        <a href="${referralLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;margin:8px 0">Get my referral link</a>
        <p style="font-size:14px;color:#94a3b8;margin-top:32px">Darren Neil · Founder, MansaMusaAI</p>
      </div>`
    );

    await db.user.update({ where: { id: user.id }, data: { referralNudgeSentAt: new Date() } as never });
    sent++;
  }

  return { sent };
});
