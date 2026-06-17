import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTotp } from "@/lib/twoFactor";
import { logAuditEvent } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, password } = await req.json();
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is not enabled." }, { status: 400 });
  }

  const passwordOk = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  const totpOk = user.twoFactorSecret ? verifyTotp(token, user.twoFactorSecret) : false;
  if (!passwordOk || !totpOk) {
    return NextResponse.json({ error: "Invalid password or OTP code." }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null },
  });
  await logAuditEvent({ userId: user.id, event: "LOGIN_SUCCESS", metadata: { action: "2fa_disabled" } });

  return NextResponse.json({ success: true });
}
