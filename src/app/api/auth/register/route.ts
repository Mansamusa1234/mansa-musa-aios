import { NextResponse } from "next/server";
import { after } from "next/server";
import crypto from "crypto";
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

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function getEmailDomain(email: string | undefined): string | undefined {
  return email?.split("@")[1]?.toLowerCase();
}

function registerLog(level: "info" | "warn" | "error", event: string, metadata: Record<string, unknown>) {
  const payload = { event, ...metadata };
  if (level === "error") console.error("[register]", payload);
  else if (level === "warn") console.warn("[register]", payload);
  else console.log("[register]", payload);
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const ip = getIP(req);
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const contentType = req.headers.get("content-type") ?? "unknown";
  const mobileHint = req.headers.get("sec-ch-ua-mobile") ?? "unknown";

  registerLog("info", "request_started", {
    requestId,
    ip,
    contentType,
    mobileHint,
    userAgent,
    env: {
      databaseUrl: !!process.env.DATABASE_URL,
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: !!process.env.NEXTAUTH_URL,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      resendApiKey: !!process.env.RESEND_API_KEY,
      emailFrom: !!process.env.EMAIL_FROM,
      upstashConfigured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    },
  });

  const limited = await checkRateLimit(limiters.register, ip);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      registerLog("warn", "invalid_json", { requestId, contentType, userAgent });
      return NextResponse.json({ error: "Invalid registration request. Please refresh and try again." }, { status: 400 });
    }

    const parsed = schema.parse(body);
    const { name, email } = parsed;
    const { password, ref } = parsed;
    registerLog("info", "validated_request", {
      requestId,
      emailDomain: getEmailDomain(email),
      hasRef: !!ref,
      nameLength: name.length,
      passwordLength: password.length,
    });

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      registerLog("info", "duplicate_email", { requestId, emailDomain: getEmailDomain(email), existingUserId: existing.id });
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const requirementError = meetsMinimumRequirements(password);
    if (requirementError) {
      registerLog("warn", "password_requirement_failed", { requestId, emailDomain: getEmailDomain(email), requirementError });
      return NextResponse.json({ error: requirementError }, { status: 400 });
    }
    if (await isPasswordBreached(password)) {
      registerLog("warn", "password_breach_rejected", { requestId, emailDomain: getEmailDomain(email) });
      return NextResponse.json({ error: "This password has appeared in a known data breach. Please choose another." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await db.user.create({
        data: { name, email, passwordHash },
      });
      registerLog("info", "user_created", { requestId, userId: user.id, emailDomain: getEmailDomain(email) });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        registerLog("info", "duplicate_email_race", { requestId, emailDomain: getEmailDomain(email), prismaCode: getPrismaErrorCode(err) });
        return NextResponse.json({ error: "Email already in use." }, { status: 409 });
      }
      registerLog("error", "user_create_failed", {
        requestId,
        emailDomain: getEmailDomain(email),
        prismaCode: getPrismaErrorCode(err),
        message: getErrorMessage(err),
      });
      throw err;
    }

    const verificationResult = await createAndSendVerificationEmail(user.id, user.email);
    registerLog(verificationResult.sent ? "info" : "warn", "verification_email_result", {
      requestId,
      userId: user.id,
      emailDomain: getEmailDomain(email),
      sent: verificationResult.sent,
      reason: verificationResult.reason,
    });

    const affCode = (await cookies()).get("mm_aff")?.value;
    after(async () => {
      const results = await Promise.allSettled([
        recordReferralSignup(ref, user.id),
        recordAffiliateSignup(affCode, user.id),
        sendEmail(user.email, "Welcome to MansaMusaAI", welcomeEmailHtml(name)),
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          registerLog("error", "post_create_task_failed", {
            requestId,
            userId: user.id,
            taskIndex: index,
            reason: getErrorMessage(result.reason),
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      emailVerificationSent: verificationResult.sent,
      warning: verificationResult.sent ? undefined : "Account created successfully. Verification email could not be sent.",
      requestId,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      registerLog("warn", "validation_failed", { requestId, issue: err.issues[0]?.message });
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const prismaCode = getPrismaErrorCode(err);
    if (prismaCode === "P1001") {
      registerLog("error", "database_unavailable", { requestId, prismaCode, message: getErrorMessage(err) });
      return NextResponse.json({ error: "Registration failed: database is temporarily unavailable. Please try again shortly.", requestId }, { status: 503 });
    }
    if (prismaCode === "P2021" || prismaCode === "P2022") {
      registerLog("error", "database_schema_unavailable", { requestId, prismaCode, message: getErrorMessage(err) });
      return NextResponse.json({ error: "Registration failed: database schema is being updated. Please try again shortly.", requestId }, { status: 503 });
    }
    registerLog("error", "unexpected_failure", { requestId, prismaCode, message: getErrorMessage(err) });
    return NextResponse.json({ error: `Registration failed: ${getErrorMessage(err)}`, requestId }, { status: 500 });
  }
}
