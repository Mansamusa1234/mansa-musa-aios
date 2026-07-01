import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Runs every Thursday at 1pm. Emails active paid subscribers who have NEVER shared
// their referral code. One email per user, ever (tracked via referralNudgeSentAt).
// Goal: turn happy customers into unpaid sales reps.

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only run on Thursday (day 4)
  if (new Date().getDay() !== 4) {
    return NextResponse.json({ ok: true, skipped: "Not Thursday", timestamp: new Date().toISOString() });
  }

  const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000); // 3 weeks active

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
    const referralUrl = `${APP}/register?ref=${referralCode}`;
    const referralLink = referralCode ? referralUrl : `${APP}/referrals`;

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
            📤 Share your link with a business owner who needs an AI receptionist<br>
            💷 They get 10% off their first 3 months<br>
            🎯 You earn <strong style="color:#4ade80">20% of their subscription every single month</strong><br>
            🔁 As long as they stay subscribed, you keep earning<br>
            💰 No limit on how many you refer
          </p>
        </div>
        <div style="background:#0f2a1a;padding:16px 20px;border-radius:8px;margin:20px 0">
          <p style="margin:0 0 4px;font-size:13px;color:#94a3b8">YOUR REFERRAL LINK</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#4ade80;word-break:break-all">${referralLink}</p>
        </div>
        <p style="font-size:15px;line-height:1.7;color:#94a3b8">Think about who you know: a dentist, a restaurant owner, an estate agent, a solicitor. Any business that gets phone calls is a fit.</p>
        <a href="${referralLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;margin:8px 0">Get my referral link →</a>
        <p style="font-size:14px;color:#94a3b8;margin-top:32px">Darren Neil · Founder, MansaMusaAI<br>Payouts monthly via bank transfer or PayPal.</p>
      </div>`
    );

    await db.user.update({
      where: { id: user.id },
      data: { referralNudgeSentAt: new Date() } as never,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, timestamp: new Date().toISOString() });
}
