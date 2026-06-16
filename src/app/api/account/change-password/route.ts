import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { meetsMinimumRequirements } from "@/lib/passwordStrength";
import { isPasswordBreached } from "@/lib/passwordBreach";
import { logAuditEvent } from "@/lib/audit";
import { getIP } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const requirementError = meetsMinimumRequirements(newPassword);
  if (requirementError) {
    return NextResponse.json({ error: requirementError }, { status: 400 });
  }
  if (await isPasswordBreached(newPassword)) {
    return NextResponse.json({ error: "This password has appeared in a known data breach. Please choose another." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logAuditEvent({ userId: user.id, event: "PASSWORD_CHANGED", ip: getIP(req) });

  return NextResponse.json({ success: true });
}
