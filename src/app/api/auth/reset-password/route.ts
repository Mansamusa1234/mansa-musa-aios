import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getIP } from "@/lib/ratelimit";
import { meetsMinimumRequirements } from "@/lib/passwordStrength";
import { isPasswordBreached } from "@/lib/passwordBreach";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    const { token, password } = schema.parse(await req.json());

    const requirementError = meetsMinimumRequirements(password);
    if (requirementError) {
      return NextResponse.json({ error: requirementError }, { status: 400 });
    }
    if (await isPasswordBreached(password)) {
      return NextResponse.json({ error: "This password has appeared in a known data breach. Please choose another." }, { status: 400 });
    }

    const resetToken = await db.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      db.trustedSession.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await logAuditEvent({ userId: resetToken.userId, event: "PASSWORD_RESET_COMPLETED", ip: getIP(req) });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
