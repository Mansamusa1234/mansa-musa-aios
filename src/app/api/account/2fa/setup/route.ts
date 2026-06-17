import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTotpSecret, getTotpUri, generateBackupCodes, hashBackupCodes } from "@/lib/twoFactor";
import QRCode from "qrcode";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is already enabled." }, { status: 400 });
  }

  const secret = generateTotpSecret();
  const uri = getTotpUri(session.user.email, secret);
  const qrDataUrl = await QRCode.toDataURL(uri);

  await db.user.update({ where: { id: session.user.id }, data: { twoFactorSecret: secret } });

  return NextResponse.json({ qrDataUrl, secret });
}
