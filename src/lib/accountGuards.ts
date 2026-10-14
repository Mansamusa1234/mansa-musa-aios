import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { FEATURE_LABELS, getActivePlan, hasFeature, planDisplayName, requiredPlan } from "@/lib/subscription";

export const EMAIL_NOT_VERIFIED = "Please verify your email address before starting a trial or subscription. You can resend the verification email from Settings.";

/** Paid access (trial or checkout) requires a verified email. Login and free features do not. */
export async function requireVerifiedEmail(userId: string): Promise<NextResponse | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
  if (user?.emailVerified) return null;
  return NextResponse.json({ error: EMAIL_NOT_VERIFIED, code: "EMAIL_NOT_VERIFIED", settingsUrl: "/settings" }, { status: 403 });
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Rate-limit key for an email address that does not put the address itself into Redis. */
export function emailKey(email: string): string {
  return createHash("sha256").update(normaliseEmail(email)).digest("hex").slice(0, 32);
}

/**
 * Server-side plan gate for creating or changing data in a paid feature.
 * Reading and deleting existing data stay available after a downgrade.
 */
export async function requireFeature(feature: string): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Administrators run the service and are not limited by a customer plan.
  if (session.user.role === "ADMIN" || hasFeature(await getActivePlan(session.user.id), feature)) return null;
  const label = FEATURE_LABELS[feature] ?? "This feature";
  return NextResponse.json({
    error: `${label} is included in the ${planDisplayName(requiredPlan(feature))} plan and above. Upgrade from Billing to use it.`,
    code: "PLAN_REQUIRED", requiredPlan: requiredPlan(feature), upgradeUrl: "/billing",
  }, { status: 403 });
}
