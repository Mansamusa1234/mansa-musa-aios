import { NextResponse } from "next/server";
import { after } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { recordReferralSignup, recordAffiliateSignup } from "@/lib/referrals";
import { createAndSendVerificationEmail, sendEmail, welcomeEmailHtml } from "@/lib/email";
import { meetsMinimumRequirements } from "@/lib/passwordStrength";
import { isPasswordBreached } from "@/lib/passwordBreach";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your first and last name.").max(100, "Name must be under 100 characters."),
  email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters.").max(100, "Password must be under 100 characters."),
  ref: z.string().trim().max(32, "Referral code is invalid.").optional(),
});

function isUniqueConstraintError(err: unknown) {
  return typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
}

function getPrismaErrorCode(err: unknown): string | null {
  return typeof err === "object" && err !== null && "code" in err && typeof err.code === "string" ? err.code : null;
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.register, getIP(req));
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid registration request. Please refresh and try again." }, { status: 400 });
    }

    const parsed = schema.parse(body);
    const { name, email } = parsed;
    const { password, ref } = parsed;

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

    let user;
    try {
      user = await db.user.create({
        data: { name, email, passwordHash },
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return NextResponse.json({ error: "Email already in use." }, { status: 409 });
      }
      throw err;
    }

    const affCode = (await cookies()).get("mm_aff")?.value;
    after(async () => {
      const results = await Promise.allSettled([
        recordReferralSignup(ref, user.id),
        recordAffiliateSignup(affCode, user.id),
        createAndSendVerificationEmail(user.id, user.email),
        sendEmail(user.email, "Welcome to MansaMusaAI", welcomeEmailHtml(name)),
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`[register] post-create task ${index} failed:`, result.reason);
        }
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const prismaCode = getPrismaErrorCode(err);
    if (prismaCode === "P1001") {
      console.error("[register] database unavailable:", err);
      return NextResponse.json({ error: "Registration service is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    if (prismaCode === "P2021" || prismaCode === "P2022") {
      console.error("[register] database schema unavailable:", err);
      return NextResponse.json({ error: "Registration service is being updated. Please try again shortly." }, { status: 503 });
    }
    console.error("[register]", (err as Error)?.message);
    return NextResponse.json({ error: "Could not create your account right now. Please try again shortly." }, { status: 500 });
  }
}
