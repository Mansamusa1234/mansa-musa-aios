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
  const t0 = Date.now();
  const ip = getIP(req);

  const limited = await checkRateLimit(limiters.register, ip);
  if (limited) return limited;

  let email = "(unknown)";
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0].message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { name, password, ref } = parsed.data;
    email = parsed.data.email;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Try signing in instead." }, { status: 409 });
    }

    const requirementError = meetsMinimumRequirements(password);
    if (requirementError) {
      return NextResponse.json({ error: requirementError }, { status: 400 });
    }

    const breached = await isPasswordBreached(password);
    if (breached) {
      return NextResponse.json({ error: "This password has appeared in a known data breach. Please choose a different password." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: { name, email, passwordHash },
    });

    // Fire-and-forget: don't block the response on emails/referrals
    const affCode = (await cookies()).get("mm_aff")?.value;
    void Promise.all([
      recordReferralSignup(ref, user.id),
      recordAffiliateSignup(affCode, user.id),
      createAndSendVerificationEmail(user.id, user.email),
      sendEmail(user.email, "Welcome to MansaMusaAI", welcomeEmailHtml(name)),
    ]).catch((err) => console.error(`[register] post-signup tasks failed — userId=${user.id}:`, err));

    if (process.env.NODE_ENV !== "production") {
      console.log(`[register] success — userId=${user.id} elapsed=${Date.now() - t0}ms`);
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    // Prisma unique-constraint violation — race between two concurrent registrations
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists. Try signing in instead." }, { status: 409 });
    }
    // Prisma connection / DB error
    if ((err as { code?: string })?.code?.startsWith("P")) {
      console.error(`[register] database error — code=${(err as { code?: string }).code}`);
      return NextResponse.json({ error: "Database error. Please try again in a moment." }, { status: 500 });
    }
    console.error(`[register] unexpected error:`, (err as Error)?.message);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
