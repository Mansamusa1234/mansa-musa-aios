import type { Metadata } from "next";
import { PLANS } from "@/lib/stripe";
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

export default function PricingPage() {
  return <PricingContent plans={PLANS} />;
}
