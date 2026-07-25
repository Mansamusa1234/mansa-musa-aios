import { db } from "@/lib/db";

export type Plan = "free" | "starter" | "pro" | "enterprise";

const ENTERPRISE_IDS = [process.env.STRIPE_PRICE_ENTERPRISE].filter(Boolean) as string[];
const PRO_IDS = [process.env.STRIPE_PRICE_PROFESSIONAL, process.env.STRIPE_PRICE_PRO].filter(Boolean) as string[];
const STARTER_IDS = [process.env.STRIPE_PRICE_STARTER, process.env.STRIPE_PRICE_BASIC].filter(Boolean) as string[];

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
  quiver_intel: "starter",
};

export function planDisplayName(plan: Plan): string {
  return PLAN_DISPLAY[plan] ?? plan;
}

export function hasFeature(plan: Plan, feature: string): boolean {
  const required = FEATURE_GATES[feature] ?? "enterprise";
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(required);
}

export async function getActivePlan(userId: string): Promise<Plan> {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  const active = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  if (active && subscription?.stripePriceId) {
    const priceId = subscription.stripePriceId;
    if (ENTERPRISE_IDS.includes(priceId)) return "enterprise";
    if (PRO_IDS.includes(priceId)) return "pro";
    if (STARTER_IDS.includes(priceId)) return "starter";
  }
  return "free";
}
