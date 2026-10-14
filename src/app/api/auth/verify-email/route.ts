import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.login, getIP(req));
  if (limited) return limited;
  try {
    const { token } = schema.parse(await req.json());

    const verificationToken = await db.emailVerificationToken.findUnique({ where: { token } });
    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
    }

    const currentUser = await db.user.findUnique({ where: { id: verificationToken.userId } });
    const isEmailChange = currentUser && currentUser.email !== verificationToken.email;

    if (isEmailChange) {
      const conflict = await db.user.findUnique({ where: { email: verificationToken.email } });
      if (conflict) {
        return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
      }
    }

    // Claim the token atomically: a link can be used once, even by concurrent requests.
    const used = await db.$transaction(async (tx) => {
      const claim = await tx.emailVerificationToken.updateMany({
        where: { id: verificationToken.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claim.count !== 1) return false;
      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { email: verificationToken.email, emailVerified: new Date() },
      });
      return true;
    });
    if (!used) return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });

    await logAuditEvent({ userId: verificationToken.userId, event: isEmailChange ? "EMAIL_CHANGED" : "EMAIL_VERIFIED" });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[verify-email]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
