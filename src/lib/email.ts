import crypto from "crypto";
import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "MansaMusaAI <onboarding@resend.dev>";
const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

export interface SendResult {
  sent: boolean;
  reason?: string;
}

/** Best-effort transactional email. Never throws — logs and returns unsent if no provider is configured. */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!resend) {
    console.log(`[email] Not configured (RESEND_API_KEY missing) — would have sent "${subject}" to ${to}`);
    return { sent: false, reason: "Email provider not configured." };
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false, reason: "Email send failed." };
  }
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function btn(href: string, text: string) {
  return `<p style="margin:20px 0 0"><a href="${href}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">${text}</a></p>`;
}

function wrapper(title: string, bodyHtml: string, footer = "If you didn't request this, you can safely ignore this email."): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
    <p style="font-weight:700;font-size:18px;margin:0 0 24px">Mansa<span style="color:#6366f1">Musa</span>AI</p>
    <h2 style="font-size:20px;margin:0 0 12px">${title}</h2>
    ${bodyHtml}
    <p style="color:#9ca3af;font-size:12px;margin-top:32px">${footer}</p>
  </div>`;
}

const SUPPORT_FOOTER = `Questions? Email <a href="mailto:ai@mansamusainitiative.com" style="color:#6366f1;text-decoration:none">ai@mansamusainitiative.com</a>`;

// ── Auth ─────────────────────────────────────────────────────────────────────

export function passwordResetEmailHtml(resetUrl: string): string {
  return wrapper(
    "Reset your password",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Click the button below to choose a new password. This link expires in 1 hour.</p>
     ${btn(resetUrl, "Reset password")}`
  );
}

export function verificationEmailHtml(verifyUrl: string): string {
  return wrapper(
    "Verify your email",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Click the button below to verify your account. This link expires in 24 hours.</p>
     ${btn(verifyUrl, "Verify email")}`
  );
}

export async function createAndSendVerificationEmail(userId: string, email: string): Promise<SendResult> {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    await db.emailVerificationToken.create({
      data: { userId, email, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    const verifyUrl = `${process.env.NEXTAUTH_URL ?? APP}/verify-email?token=${token}`;
    return await sendEmail(email, "Verify your MansaMusaAI email", verificationEmailHtml(verifyUrl));
  } catch (err) {
    console.error("[email] createAndSendVerificationEmail failed:", err);
    return { sent: false, reason: "Could not create verification token." };
  }
}

export function suspiciousLoginEmailHtml(details: { ip?: string; userAgent?: string; when: string }): string {
  return wrapper(
    "New sign-in to your account",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">We noticed a sign-in from a new device or location:</p>
     <p style="color:#1a1a2e;font-size:13px;background:#f3f4f6;border-radius:8px;padding:12px">
       ${esc(details.when)}<br/>${details.ip ? `IP: ${esc(details.ip)}<br/>` : ""}${details.userAgent ? `Device: ${esc(details.userAgent)}` : ""}
     </p>
     <p style="color:#4b5563;font-size:14px;line-height:1.6">If this was you, no action is needed. If not, change your password immediately.</p>
     ${btn(`${APP}/settings`, "Review account security")}`
  );
}

// ── Welcome ──────────────────────────────────────────────────────────────────

export function welcomeEmailHtml(name: string): string {
  return wrapper(
    `Welcome to MansaMusaAI, ${esc(name)}`,
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Your AI Business Operating System is ready. Here's what to try first:</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><td style="padding:8px 0;font-size:13px;color:#1a1a2e;vertical-align:top;white-space:nowrap"><span style="color:#6366f1;font-weight:600;margin-right:8px">Chat</span></td><td style="padding:8px 0;font-size:13px;color:#4b5563">Talk to 41 specialist AI agents</td></tr>
       <tr><td style="padding:8px 0;font-size:13px;color:#1a1a2e;vertical-align:top;white-space:nowrap"><span style="color:#6366f1;font-weight:600;margin-right:8px">Model Hub</span></td><td style="padding:8px 0;font-size:13px;color:#4b5563">Switch between Claude, GPT-4o, Grok, Gemini, Mistral</td></tr>
       <tr><td style="padding:8px 0;font-size:13px;color:#1a1a2e;vertical-align:top;white-space:nowrap"><span style="color:#6366f1;font-weight:600;margin-right:8px">Wisdom Arena</span></td><td style="padding:8px 0;font-size:13px;color:#4b5563">Run multi-agent debates for big decisions</td></tr>
       <tr><td style="padding:8px 0;font-size:13px;color:#1a1a2e;vertical-align:top;white-space:nowrap"><span style="color:#6366f1;font-weight:600;margin-right:8px">Workforce OS</span></td><td style="padding:8px 0;font-size:13px;color:#4b5563">Calendar, support tickets, CRM, team hub</td></tr>
     </table>
     ${btn(`${APP}/dashboard`, "Go to dashboard")}`,
    SUPPORT_FOOTER
  );
}

// ── Billing ───────────────────────────────────────────────────────────────────

export function subscriptionStartedEmailHtml(opts: {
  name: string;
  plan: string;
  amount: string;
  nextBillDate: string;
}): string {
  return wrapper(
    `You're on ${esc(opts.plan)} — welcome!`,
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, your <strong>${esc(opts.plan)}</strong> subscription is now active.</p>
     <p style="color:#1a1a2e;font-size:13px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px">
       Plan: <strong>${esc(opts.plan)}</strong><br/>
       Amount: <strong>${esc(opts.amount)}/mo</strong><br/>
       Next billing date: <strong>${esc(opts.nextBillDate)}</strong>
     </p>
     <p style="color:#4b5563;font-size:14px;line-height:1.6">All ${esc(opts.plan)} features are now unlocked. Head to your dashboard to get started.</p>
     ${btn(`${APP}/dashboard`, "Go to dashboard")}`,
    SUPPORT_FOOTER
  );
}

export function subscriptionCancelledEmailHtml(opts: {
  name: string;
  plan: string;
  endsAt: string;
}): string {
  return wrapper(
    "Your subscription has been cancelled",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, your <strong>${esc(opts.plan)}</strong> plan has been cancelled.</p>
     <p style="color:#4b5563;font-size:14px;line-height:1.6">You'll keep full access until <strong>${esc(opts.endsAt)}</strong>, then your account moves to Free. Your data, agents, and history stay intact.</p>
     ${btn(`${APP}/billing`, "Re-subscribe")}`,
    SUPPORT_FOOTER
  );
}

export function paymentFailedEmailHtml(opts: {
  name: string;
  plan: string;
  updateUrl: string;
}): string {
  return wrapper(
    "Payment failed — action required",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, we couldn't charge your card for your <strong>${esc(opts.plan)}</strong> subscription.</p>
     <p style="color:#dc2626;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px">Without a successful payment, your subscription will be suspended after a short grace period.</p>
     <p style="color:#4b5563;font-size:14px;line-height:1.6">Please update your payment method to keep uninterrupted access.</p>
     ${btn(opts.updateUrl, "Update payment method")}`,
    SUPPORT_FOOTER
  );
}

// ── Affiliate & referral ──────────────────────────────────────────────────────

export function commissionApprovedEmailHtml(opts: {
  name: string;
  amountGbp: string;
  sourceType: string;
}): string {
  return wrapper(
    "Commission approved",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, your <strong>${esc(opts.sourceType.toLowerCase())}</strong> commission of <strong>£${esc(opts.amountGbp)}</strong> has been approved and is queued for payout. We'll notify you once payment is sent.</p>
     ${btn(`${APP}/affiliate`, "View your dashboard")}`,
    SUPPORT_FOOTER
  );
}

export function commissionPaidEmailHtml(opts: {
  name: string;
  amountGbp: string;
}): string {
  return wrapper(
    "Commission paid",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, your commission of <strong>£${esc(opts.amountGbp)}</strong> has been sent. Check your bank account for the transfer.</p>
     ${btn(`${APP}/affiliate`, "View commission history")}`,
    SUPPORT_FOOTER
  );
}

export function referralConvertedEmailHtml(opts: {
  name: string;
  rewardGbp: string;
}): string {
  return wrapper(
    "Referral reward earned",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, someone you referred just upgraded to a paid plan. You've earned a reward of <strong>£${esc(opts.rewardGbp)}</strong> — it's pending admin approval and will appear in your ledger shortly.</p>
     ${btn(`${APP}/referrals`, "View your referrals")}`,
    SUPPORT_FOOTER
  );
}

export function affiliateConversionEmailHtml(opts: {
  name: string;
  commissionGbp: string;
}): string {
  return wrapper(
    "New affiliate commission earned",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, a user referred via your affiliate link just subscribed. You've earned a commission of <strong>£${esc(opts.commissionGbp)}</strong> — pending admin approval.</p>
     ${btn(`${APP}/affiliate`, "View affiliate dashboard")}`,
    SUPPORT_FOOTER
  );
}

// ── Agent & usage alerts ──────────────────────────────────────────────────────

// ── Lead & booking notifications ─────────────────────────────────────────────

export function newLeadEmailHtml(opts: {
  name: string; email?: string; phone?: string; company?: string; message?: string; source: string;
}): string {
  const rows = [
    opts.email   && `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;width:80px">Email</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.email)}</td></tr>`,
    opts.phone   && `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Phone</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.phone)}</td></tr>`,
    opts.company && `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Company</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.company)}</td></tr>`,
    opts.message && `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;vertical-align:top">Message</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.message)}</td></tr>`,
  ].filter(Boolean).join("");

  return wrapper(
    `New lead: ${esc(opts.name)}`,
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">A new lead just came in via your <strong>${esc(opts.source)}</strong>.</p>
     <table style="width:100%;border-collapse:collapse;margin:12px 0;background:#f9fafb;border-radius:8px;padding:12px">
       <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;width:80px">Name</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a2e">${esc(opts.name)}</td></tr>
       ${rows}
     </table>
     ${btn(`${APP}/crm`, "View in CRM")}`,
    SUPPORT_FOOTER
  );
}

export function bookingConfirmedGuestEmailHtml(opts: {
  guestName: string; startAt: string; endAt: string; title: string; notes?: string;
}): string {
  return wrapper(
    "Your appointment is confirmed",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.guestName)}, your booking is confirmed. Here are the details:</p>
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
       <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1a1a2e">${esc(opts.title)}</p>
       <p style="margin:0 0 4px;font-size:13px;color:#4b5563">📅 ${esc(opts.startAt)}</p>
       <p style="margin:0;font-size:13px;color:#4b5563">🕐 Until ${esc(opts.endAt)}</p>
       ${opts.notes ? `<p style="margin:8px 0 0;font-size:12px;color:#6b7280;border-top:1px solid #d1fae5;padding-top:8px">${esc(opts.notes)}</p>` : ""}
     </div>
     <p style="color:#4b5563;font-size:14px;line-height:1.6">We look forward to seeing you. If you need to reschedule, please get in touch.</p>`,
    SUPPORT_FOOTER
  );
}

export function newBookingOwnerEmailHtml(opts: {
  guestName: string; guestEmail: string; guestPhone?: string; startAt: string; title: string; notes?: string;
}): string {
  return wrapper(
    `New booking: ${esc(opts.guestName)}`,
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">You have a new appointment in your calendar.</p>
     <table style="width:100%;border-collapse:collapse;margin:12px 0;background:#f9fafb;border-radius:8px;padding:12px">
       <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;width:80px">Name</td><td style="padding:4px 0;font-size:13px;font-weight:600;color:#1a1a2e">${esc(opts.guestName)}</td></tr>
       <tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Email</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.guestEmail)}</td></tr>
       ${opts.guestPhone ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Phone</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.guestPhone)}</td></tr>` : ""}
       <tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Time</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.startAt)}</td></tr>
       ${opts.notes ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;vertical-align:top">Notes</td><td style="padding:4px 0;font-size:13px;color:#1a1a2e">${esc(opts.notes)}</td></tr>` : ""}
     </table>
     ${btn(`${APP}/calendar`, "View calendar")}`,
    SUPPORT_FOOTER
  );
}

export function usageLimitWarningEmailHtml(opts: {
  name: string;
  used: number;
  limit: number;
  plan: string;
}): string {
  const pct = Math.min(100, Math.round((opts.used / opts.limit) * 100));
  return wrapper(
    "You're approaching your message limit",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Hi ${esc(opts.name)}, you've used <strong>${opts.used} of ${opts.limit} messages</strong> (${pct}%) on your ${esc(opts.plan)} plan this month.</p>
     <div style="background:#e5e7eb;border-radius:6px;height:10px;overflow:hidden;margin:16px 0">
       <div style="background:#6366f1;height:10px;width:${pct}%;border-radius:6px"></div>
     </div>
     <p style="color:#4b5563;font-size:14px;line-height:1.6">Once you hit the limit, you won't be able to send new messages until next month or you upgrade. Upgrade now to keep going without interruption.</p>
     ${btn(`${APP}/billing`, "Upgrade your plan")}`,
    SUPPORT_FOOTER
  );
}
