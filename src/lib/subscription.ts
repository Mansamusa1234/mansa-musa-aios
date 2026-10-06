import { db } from "@/lib/db";

export type Plan = "free" | "starter" | "pro" | "enterprise";

const ENTERPRISE_IDS = [process.env.STRIPE_PRICE_ENTERPRISE, process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL].filter(Boolean) as string[];
const PRO_IDS = [process.env.STRIPE_PRICE_PROFESSIONAL, process.env.STRIPE_PRICE_PRO, process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL].filter(Boolean) as string[];
const STARTER_IDS = [process.env.STRIPE_PRICE_STARTER, process.env.STRIPE_PRICE_BASIC, process.env.STRIPE_PRICE_STARTER_ANNUAL].filter(Boolean) as string[];

const PLAN_ORDER: Plan[] = ["free", "starter", "pro", "enterprise"];

const PLAN_DISPLAY: Record<Plan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Professional",
  enterprise: "Enterprise",
};

const FEATURE_GATES: Record<string, Plan> = {
  agent_arena: "starter",
  export_letter_pack: "pro",
  workforce_csuite: "starter",
  agent_marketplace: "free",
  receptionist: "starter",
  wisdom_arena: "starter",
};

export function planDisplayName(plan: Plan): string {
  return PLAN_DISPLAY[plan] ?? plan;
}

export function hasFeature(plan: Plan, feature: string): boolean {
  const required = FEATURE_GATES[feature] ?? "enterprise";
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(required);
}

export function resolveSubscriptionPlan(subscription: { status: string; stripePriceId: string | null; trialEndsAt?: Date | null } | null): Plan {
  if (!subscription) return "free";
  if (subscription.status === "TRIALING") {
    if (subscription.trialEndsAt && subscription.trialEndsAt.getTime() <= Date.now()) return "free";
    // The card-free trial grants Professional access until its explicit expiry.
    if (!subscription.stripePriceId && subscription.trialEndsAt) return "pro";
  }
  if (subscription.status !== "ACTIVE" && subscription.status !== "TRIALING") return "free";
  const priceId = subscription.stripePriceId;
  if (!priceId) return "free";
  if (ENTERPRISE_IDS.includes(priceId)) return "enterprise";
  if (PRO_IDS.includes(priceId)) return "pro";
  if (STARTER_IDS.includes(priceId)) return "starter";
  return "free";
}

export async function getActivePlan(userId: string): Promise<Plan> {
  return resolveSubscriptionPlan(await db.subscription.findUnique({ where: { userId } }));
}
