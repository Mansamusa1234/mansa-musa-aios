import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { token } = schema.parse(await req.json());

    const verificationToken = await db.emailVerificationToken.findUnique({ where: { token } });
    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
    }

    await db.$transaction([
      db.user.update({ where: { id: verificationToken.userId }, data: { emailVerified: new Date() } }),
      db.emailVerificationToken.update({ where: { id: verificationToken.id }, data: { usedAt: new Date() } }),
    ]);

    await logAuditEvent({ userId: verificationToken.userId, event: "EMAIL_VERIFIED" });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[verify-email]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
