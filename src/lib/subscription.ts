import { db } from "@/lib/db";

export type Plan = "free" | "starter" | "pro" | "enterprise";

const ENTERPRISE_IDS = [process.env.STRIPE_PRICE_ENTERPRISE].filter(Boolean) as string[];
const PRO_IDS = [process.env.STRIPE_PRICE_PROFESSIONAL, process.env.STRIPE_PRICE_PRO].filter(Boolean) as string[];
const STARTER_IDS = [process.env.STRIPE_PRICE_STARTER, process.env.STRIPE_PRICE_BASIC].filter(Boolean) as string[];

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
