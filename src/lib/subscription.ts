import { db } from "@/lib/db";

export type Plan = "free" | "basic" | "pro" | "enterprise";

export async function getActivePlan(userId: string): Promise<Plan> {
  const subscription = await db.subscription.findUnique({ where: { userId } });
  if (subscription?.status === "ACTIVE" && subscription.stripePriceId) {
    const priceId = subscription.stripePriceId;
    if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return "enterprise";
    if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
    if (priceId === process.env.STRIPE_PRICE_BASIC) return "basic";
  }
  return "free";
}
