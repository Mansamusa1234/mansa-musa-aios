import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTotp, generateBackupCodes, hashBackupCodes } from "@/lib/twoFactor";
import { logAuditEvent } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "OTP token required." }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "2FA setup not initiated." }, { status: 400 });
  }

  const valid = verifyTotp(token, user.twoFactorSecret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code. Try again." }, { status: 400 });
  }

  const backupCodes = generateBackupCodes();
  const hashedCodes = hashBackupCodes(backupCodes);

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorBackupCodes: hashedCodes },
  });
  await logAuditEvent({ userId: user.id, event: "LOGIN_SUCCESS", metadata: { action: "2fa_enabled" } });

  return NextResponse.json({ success: true, backupCodes });
}
