import { db } from "@/lib/db";

export type Plan = "free" | "basic" | "pro" | "enterprise";
export type PaidFeature = "agent_arena" | "deep_research" | "export_letter_pack";

const PLAN_ORDER: Record<Plan, number> = { free: 0, basic: 1, pro: 2, enterprise: 3 };

export async function getActivePlan(userId: string): Promise<Plan> {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  if (subscription?.status === "ACTIVE" && subscription.stripePriceId) {
    const priceId = subscription.stripePriceId;
    if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return "enterprise";
    if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL || priceId === process.env.STRIPE_PRICE_PRO) return "pro";
    if (priceId === process.env.STRIPE_PRICE_STARTER || priceId === process.env.STRIPE_PRICE_BASIC) return "basic";
  }
  return "free";
}

export function planMeets(plan: Plan, required: Plan): boolean {
  return PLAN_ORDER[plan] >= PLAN_ORDER[required];
}

export function hasFeature(plan: Plan, feature: PaidFeature): boolean {
  switch (feature) {
    case "agent_arena":
    case "deep_research":
      return planMeets(plan, "pro");
    case "export_letter_pack":
      return planMeets(plan, "basic");
  }
}

export function planDisplayName(plan: Plan): string {
  if (plan === "basic") return "Starter";
  if (plan === "pro") return "Professional";
  if (plan === "enterprise") return "Enterprise";
  return "Free";
}
