import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

function nudgeHtml(name: string, wave: 1 | 2 | 3): string {
  const content = {
    1: {
      headline: "Your AI receptionist is waiting — 2 minutes to set up",
      body: `You signed up for MansaMusaAI yesterday — brilliant move.<br><br>You haven't set up your AI receptionist yet. It takes <strong>under 2 minutes</strong> and once it's live, it answers every call and captures every lead automatically — even at 2am.<br><br>Here's what happens after setup:<br><br>Every missed call gets answered<br>Leads are captured into your CRM<br>Appointments book themselves<br>WhatsApp replies go out instantly<br><br>Let's get you live.`,
    },
    2: {
      headline: "Still missing calls? Let's fix that right now",
      body: `Three days in and your AI receptionist still isn't live.<br><br>Every day without it, you're losing leads to businesses that are already using AI. The setup literally takes 2 minutes — just give it a name, a greeting, and you're live.<br><br><strong>UK businesses using MansaMusaAI see on average:</strong><br><br>3x more leads captured<br>40% more appointments booked<br>60%+ revenue increase within 90 days<br><br>Don't leave money on the table.`,
    },
    3: {
      headline: "One week in — you're still not set up. Here's why that matters.",
      body: `It's been a week since you joined MansaMusaAI and your AI receptionist still isn't active.<br><br>I want to be straight with you — if you're not set up in the next few days, your trial will expire and you'll lose access.<br><br>If there's anything stopping you — confusion, a question, anything — just reply to this email. A real human will help you get live within the hour.<br><br>You're this close. Let's finish it.`,
    },
  }[wave];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">
  <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:28px 32px;text-align:center">
      <p style="margin:0;color:#fff;font-size:22px;font-weight:800">MansaMusaAI</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;font-weight:700">${content.headline}</h2>
      <p style="margin:0 0 8px;color:#64748b;font-size:15px">Hi ${name},</p>
      <p style="margin:8px 0 24px;color:#334155;font-size:15px;line-height:1.7">${content.body}</p>
      <a href="${APP}/onboarding" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px">
        Set up my AI receptionist
      </a>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:13px">Need help? Just reply — we respond within 2 hours.</p>
    </div>
  </div>
  <p style="text-align:center;color:#cbd5e1;font-size:12px;margin-top:16px">MansaMusaAI · mansamusainitiative.com</p>
</div>
</body></html>`;
}

const subjects: Record<1 | 2 | 3, string> = {
  1: "Your AI receptionist is ready — 2 mins to go live",
  2: "Still missing calls? Your AI receptionist isn't live yet",
  3: "Last nudge — get set up before your trial runs out",
};

export const GET = withCron(async () => {
  const now = new Date();
  const results: { userId: string; wave: number; success: boolean }[] = [];

  const waves: Array<{ wave: 1 | 2 | 3; daysAgo: number }> = [
    { wave: 1, daysAgo: 1 },
    { wave: 2, daysAgo: 3 },
    { wave: 3, daysAgo: 7 },
  ];

  for (const { wave, daysAgo } of waves) {
    const from = new Date(now.getTime() - (daysAgo + 1) * 86400000);
    const to   = new Date(now.getTime() - daysAgo * 86400000);

    const users = await db.user.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        receptionist: { is: null },
        [`activationNudge${wave}SentAt`]: null,
      } as never,
      select: { id: true, email: true, name: true },
      take: 100,
    });

    for (const user of users) {
      try {
        const name = user.name?.split(" ")[0] ?? "there";
        await sendEmail(user.email, subjects[wave], nudgeHtml(name, wave));
        await db.user.update({
          where: { id: user.id },
          data: { [`activationNudge${wave}SentAt`]: now } as never,
        });
        results.push({ userId: user.id, wave, success: true });
      } catch (err) {
        console.error(`[cron/activation-nudge] wave ${wave} failed for ${user.id}:`, err);
        results.push({ userId: user.id, wave, success: false });
      }
    }
  }

  return { sent: results.filter((r) => r.success).length, results };
});
