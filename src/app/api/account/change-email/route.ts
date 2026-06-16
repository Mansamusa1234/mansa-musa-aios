import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAndSendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({ newEmail: z.string().email(), currentPassword: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid new email and current password are required." }, { status: 400 });
  }
  const { newEmail, currentPassword } = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  if (newEmail === user.email) {
    return NextResponse.json({ error: "That is already your current email address." }, { status: 400 });
  }

  const conflict = await db.user.findUnique({ where: { email: newEmail } });
  if (conflict) {
    return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
  }

  await createAndSendVerificationEmail(user.id, newEmail);

  return NextResponse.json({ success: true, message: `A verification link has been sent to ${newEmail}. Your email will change once you confirm it.` });
}
