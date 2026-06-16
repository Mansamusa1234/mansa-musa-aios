import crypto from "crypto";
import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "MansaMusaAI <onboarding@resend.dev>";

export interface SendResult {
  sent: boolean;
  reason?: string;
}

/** Best-effort transactional email send. Never throws -- logs and reports unsent if no provider is configured. */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
  if (!resend) {
    console.log(`[email] Not configured (RESEND_API_KEY missing) -- would have sent "${subject}" to ${to}`);
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

function wrapper(title: string, bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
    <p style="font-weight:700;font-size:18px;margin:0 0 24px">Mansa<span style="color:#6366f1">Musa</span>AI</p>
    <h2 style="font-size:20px;margin:0 0 12px">${title}</h2>
    ${bodyHtml}
    <p style="color:#9ca3af;font-size:12px;margin-top:32px">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return wrapper(
    "Reset your password",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Click the button below to choose a new password. This link expires in 1 hour.</p>
     <p><a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Reset password</a></p>`
  );
}

export function verificationEmailHtml(verifyUrl: string): string {
  return wrapper(
    "Verify your email",
    `<p style="color:#4b5563;font-size:14px;line-height:1.6">Click the button below to verify your account. This link expires in 24 hours.</p>
     <p><a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Verify email</a></p>`
  );
}

/** Generates a fresh verification token and emails it. Best-effort -- never throws. */
export async function createAndSendVerificationEmail(userId: string, email: string): Promise<SendResult> {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    await db.emailVerificationToken.create({
      data: { userId, email, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
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
       ${details.when}<br/>${details.ip ? `IP: ${details.ip}<br/>` : ""}${details.userAgent ? `Device: ${details.userAgent}` : ""}
     </p>
     <p style="color:#4b5563;font-size:14px;line-height:1.6">If this was you, no action is needed. If not, change your password immediately from Settings.</p>`
  );
}
