import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

function winBackHtml(name: string, wave: 1 | 2 | 3): string {
  const subject3 =
    wave === 1
      ? { headline: "Your MansaMusaAI account is still here", body: `You recently cancelled MansaMusaAI. Your account and data are still here if you want to come back.<br><br>Plans start at £49 a month (Starter: website chat AI receptionist, CRM, appointment booking and your AI executive team), and you can cancel from Billing whenever you like.` }
      : wave === 2
      ? { headline: "Still thinking about it?", body: `A week ago you cancelled MansaMusaAI — we get it, timing isn't always right.<br><br>If you'd like to tell us what didn't work, just reply to this email. We read every reply.` }
      : { headline: "This is our last email", body: `It's been a month since you left MansaMusaAI. This is our final email — we don't want to spam you.<br><br>If you ever want to come back, your account is still here. Whatever you decide — good luck with your business. We genuinely mean that.` };

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">
  <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:28px 32px;text-align:center">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:800">MansaMusaAI</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;font-weight:700">${subject3.headline}</h2>
      <p style="margin:0 0 8px;color:#64748b;font-size:15px">Hi ${name},</p>
      <p style="margin:8px 0 24px;color:#334155;font-size:15px;line-height:1.6">${subject3.body}</p>
      <a href="${APP}/pricing" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px">
        Reactivate my account
      </a>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:13px">Questions? Reply to this email — a real human will respond within 2 hours.</p>
    </div>
  </div>
  <p style="text-align:center;color:#cbd5e1;font-size:12px;margin-top:16px">MansaMusaAI · mansamusainitiative.com</p>
</div>
</body></html>`;
}

const subjects: Record<1 | 2 | 3, string> = {
  1: "Your MansaMusaAI account is still here",
  2: "What didn't work for you?",
  3: "Our last email from MansaMusaAI",
};

export const GET = withCron(async () => {
  const now = new Date();
  const results: { userId: string; wave: number; success: boolean }[] = [];

  const windows: Array<{ wave: 1 | 2 | 3; daysAgo: number; field: "winBack1SentAt" | "winBack2SentAt" | "winBack3SentAt" }> = [
    { wave: 1, daysAgo: 3,  field: "winBack1SentAt" },
    { wave: 2, daysAgo: 7,  field: "winBack2SentAt" },
    { wave: 3, daysAgo: 30, field: "winBack3SentAt" },
  ];

  for (const { wave, daysAgo, field } of windows) {
    const from = new Date(now.getTime() - (daysAgo + 1) * 86400000);
    const to   = new Date(now.getTime() - daysAgo * 86400000);

    const subs = await db.subscription.findMany({
      where: {
        status: "CANCELED",
        updatedAt: { gte: from, lte: to },
        [field]: null,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
      take: 50,
    });

    for (const sub of subs) {
      try {
        const name = sub.user.name?.split(" ")[0] ?? "there";
        await sendEmail(sub.user.email, subjects[wave], winBackHtml(name, wave));
        await db.subscription.update({
          where: { id: sub.id },
          data: { [field]: now },
        });
        results.push({ userId: sub.userId, wave, success: true });
      } catch (err) {
        console.error(`[cron/win-back] wave ${wave} failed for ${sub.userId}:`, err);
        results.push({ userId: sub.userId, wave, success: false });
      }
    }
  }

  return { sent: results.filter((r) => r.success).length, results };
});
