import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { recordReferralSignup, recordAffiliateSignup } from "@/lib/referrals";
import { createAndSendVerificationEmail, sendEmail, welcomeEmailHtml } from "@/lib/email";
import { meetsMinimumRequirements } from "@/lib/passwordStrength";
import { isPasswordBreached } from "@/lib/passwordBreach";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  ref: z.string().max(32).optional(),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.register, getIP(req));
  if (limited) return limited;

  try {
    const body = await req.json();
    const { name, email, password, ref } = schema.parse(body);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const requirementError = meetsMinimumRequirements(password);
    if (requirementError) {
      return NextResponse.json({ error: requirementError }, { status: 400 });
    }
    if (await isPasswordBreached(password)) {
      return NextResponse.json({ error: "This password has appeared in a known data breach. Please choose another." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: { name, email, passwordHash },
    });

    const affCode = (await cookies()).get("mm_aff")?.value;
    await Promise.all([
      recordReferralSignup(ref, user.id),
      recordAffiliateSignup(affCode, user.id),
      createAndSendVerificationEmail(user.id, user.email),
      sendEmail(user.email, "Welcome to MansaMusaAI", welcomeEmailHtml(name)),
    ]);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[register]", (err as Error)?.message);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
