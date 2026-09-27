import { db } from "@/lib/db";

export async function canUseBusinessResearch(userId: string, role?: string | null): Promise<boolean> {
  if (role === "ADMIN") return true;

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { status: true, stripePriceId: true },
  });
  if (!subscription || !["ACTIVE", "TRIALING"].includes(subscription.status) || !subscription.stripePriceId) {
    return false;
  }

  const paidResearchPriceIds = [
    process.env.STRIPE_PRICE_PROFESSIONAL,
    process.env.STRIPE_PRICE_PRO,
    process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
    process.env.STRIPE_PRICE_ENTERPRISE,
    process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
  ].filter(Boolean);

  return paidResearchPriceIds.includes(subscription.stripePriceId);
}
