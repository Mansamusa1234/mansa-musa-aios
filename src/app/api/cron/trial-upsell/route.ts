import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export const GET = withCron(async () => {
  const trialing = await db.subscription.findMany({
    where: { status: "TRIALING" },
    include: { user: true },
  });

  let sent = 0;

  for (const sub of trialing) {
    const { user, trialEndsAt, trialUpsell1SentAt, trialUpsell2SentAt, trialUpsell3SentAt } = sub as typeof sub & {
      trialUpsell1SentAt: Date | null;
      trialUpsell2SentAt: Date | null;
      trialUpsell3SentAt: Date | null;
    };
    if (!user.email || !trialEndsAt) continue;

    const trialStart = new Date(trialEndsAt.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dayIn = daysSince(trialStart);
    const daysLeft = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const name = user.name ?? "there";
    const upgradeUrl = `${APP}/billing`;

    if (dayIn >= 3 && !trialUpsell1SentAt) {
      await sendEmail(
        user.email,
        `${name}, your AI receptionist is ready`,
        `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#0a0a1a;color:#e2e8f0">
          <h2 style="color:#a78bfa;margin:0 0 16px">Day 3 of your trial</h2>
          <p style="font-size:16px;line-height:1.7">Hey ${name},</p>
          <p style="font-size:16px;line-height:1.7">You've had MansaMusaAI for 3 days. Your Professional trial includes:</p>
          <div style="background:#1e1b4b;border-left:3px solid #7c3aed;padding:16px 20px;margin:20px 0;border-radius:4px">
            <p style="margin:0;font-size:15px">An AI receptionist for your website chat<br>
            Lead capture into your CRM<br>
            Appointment booking<br>
            Email automation sequences</p>
          </div>
          <p style="font-size:16px;line-height:1.7">You've got ${daysLeft} days left on your Professional trial. Make sure your receptionist is set up — it takes 3 minutes.</p>
          <a href="${APP}/receptionist" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;margin:8px 0">Set up my receptionist</a>
          <p style="font-size:14px;color:#94a3b8;margin-top:32px">Darren Neil · Founder, MansaMusaAI<br>mansamusainitiative.com</p>
        </div>`
      );
      await db.subscription.update({
        where: { id: sub.id },
        data: { trialUpsell1SentAt: new Date() } as never,
      });
      sent++;
    }

    if (dayIn >= 7 && !trialUpsell2SentAt) {
      await sendEmail(
        user.email,
        `Halfway through your trial — here's what you'd lose`,
        `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#0a0a1a;color:#e2e8f0">
          <h2 style="color:#a78bfa;margin:0 0 16px">7 days in. ${daysLeft} days left.</h2>
          <p style="font-size:16px;line-height:1.7">Hey ${name},</p>
          <p style="font-size:16px;line-height:1.7">You're halfway through your Professional trial. When it ends in ${daysLeft} days, your account returns to the Free plan (5 AI chats a day). Your existing data stays; creating new items needs a paid plan:</p>
          <div style="background:#1e1b4b;border:1px solid #7c3aed33;padding:20px;border-radius:8px;margin:20px 0">
            <p style="margin:0;font-size:15px;color:#cbd5e1">
              Starter, £49/month: website chat AI receptionist, CRM, appointment booking, AI executive team<br>
              Professional, £149/month: everything in Starter plus email automation sequences and the Business Research Desk
            </p>
          </div>
          <a href="${upgradeUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;margin:8px 0">Keep everything — upgrade now</a>
          <p style="font-size:14px;color:#94a3b8;margin-top:32px">Darren Neil · Founder, MansaMusaAI</p>
        </div>`
      );
      await db.subscription.update({
        where: { id: sub.id },
        data: { trialUpsell2SentAt: new Date() } as never,
      });
      sent++;
    }

    if (dayIn >= 12 && !trialUpsell3SentAt) {
      await sendEmail(
        user.email,
        `2 days left — your AI receptionist goes offline`,
        `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#0a0a1a;color:#e2e8f0">
          <div style="background:#7c1d1d;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center">
            <p style="margin:0;font-size:18px;font-weight:700;color:#fca5a5">${daysLeft} days remaining on your trial</p>
          </div>
          <p style="font-size:16px;line-height:1.7">Hey ${name},</p>
          <p style="font-size:16px;line-height:1.7">Your trial ends in ${daysLeft} days. After that your account returns to the Free plan: the AI receptionist, CRM, appointment booking and email automation need a paid plan.</p>
          <div style="background:#1e1b4b;border:2px solid #7c3aed;padding:20px;border-radius:8px;margin:20px 0;text-align:center">
            <p style="font-size:22px;font-weight:700;color:#a78bfa;margin:0 0 8px">Professional Plan</p>
            <p style="font-size:36px;font-weight:800;color:#fff;margin:0 0 4px">£149<span style="font-size:18px;color:#94a3b8">/mo</span></p>
            <p style="color:#94a3b8;margin:0 0 16px">Or choose Starter at £49/month. Cancel from Billing whenever you like.</p>
            <a href="${upgradeUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:700;font-size:18px">Secure my plan now</a>
          </div>
          <p style="font-size:14px;color:#94a3b8;margin-top:32px">Questions? Reply to this email — I read every one.<br><br>Darren Neil · Founder, MansaMusaAI</p>
        </div>`
      );
      await db.subscription.update({
        where: { id: sub.id },
        data: { trialUpsell3SentAt: new Date() } as never,
      });
      sent++;
    }
  }

  return { sent };
});
