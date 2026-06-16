import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({ email: z.string().email() });

const GENERIC_MESSAGE = "If an account exists for that email, a password reset link has been sent.";

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.forgotPassword, getIP(req));
  if (limited) return limited;

  try {
    const { email } = schema.parse(await req.json());

    const user = await db.user.findUnique({ where: { email } });
    if (user?.passwordHash) {
      const token = crypto.randomBytes(32).toString("hex");
      await db.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
      await sendEmail(email, "Reset your MansaMusaAI password", passwordResetEmailHtml(resetUrl));
      await logAuditEvent({ userId: user.id, event: "PASSWORD_RESET_REQUESTED", ip: getIP(req) });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[forgot-password]", err);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
