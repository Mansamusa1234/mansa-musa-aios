import type { Metadata } from "next";
import { PLANS, getLivePrices } from "@/lib/stripe";
import PricingContent from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for every stage of growth. Start free, upgrade when you need more. No hidden fees, cancel anytime.",
  keywords: ["AI Pricing", "AI SaaS Pricing", "AI Subscription", "Fintech AI Plans"],
  openGraph: {
    title: "Pricing — MansaMusaAI",
    description: "Start free. Upgrade when you're ready. No hidden fees.",
  },
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const livePrices = await getLivePrices().catch(
    () => ({} as Record<string, { amount: number; currency: string }>),
  );
  const plans = PLANS.map((plan) => ({
    ...plan,
    price: plan.priceId && livePrices[plan.priceId] ? livePrices[plan.priceId].amount : plan.price,
    currency: plan.priceId && livePrices[plan.priceId] ? livePrices[plan.priceId].currency : plan.currency,
    annualPrice: plan.annualPriceId && livePrices[plan.annualPriceId]
      ? livePrices[plan.annualPriceId].amount
      : plan.annualPrice,
  }));
  return <PricingContent plans={plans} />;
}
