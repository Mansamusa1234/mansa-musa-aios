import Stripe from "stripe";
import type { PricingPlan } from "@/types";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "gbp",
    priceId: "",
    description: "Get started for free",
    features: ["20 messages / month", "Claude Haiku 4.5", "Chat history (7 days)"],
    highlighted: false,
    messagesPerMonth: 20,
  },
  {
    id: "basic",
    name: "Basic",
    price: 19,
    currency: "gbp",
    priceId: process.env.STRIPE_PRICE_BASIC ?? "",
    description: "For individuals",
    features: ["500 messages / month", "Claude Haiku 4.5", "Chat history (30 days)", "Email support"],
    highlighted: false,
    messagesPerMonth: 500,
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    currency: "gbp",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    description: "For power users",
    features: [
      "Unlimited messages",
      "Claude Sonnet 4.6",
      "Unlimited history",
      "Priority support",
      "API access",
    ],
    highlighted: true,
    messagesPerMonth: Infinity,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    currency: "gbp",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
    description: "For teams",
    features: [
      "Everything in Pro",
      "Claude Opus 4.8",
      "Team workspaces",
      "SSO / SAML",
      "Dedicated support",
      "Custom fine-tuning",
    ],
    highlighted: false,
    messagesPerMonth: Infinity,
  },
];

/** Fetch live unit_amount + currency from Stripe for all paid plans. */
export async function getLivePrices(): Promise<Record<string, { amount: number; currency: string }>> {
  const paid = PLANS.filter((p) => p.priceId);
  const results = await Promise.all(paid.map((p) => stripe.prices.retrieve(p.priceId)));
  return Object.fromEntries(
    results.map((p) => [p.id, { amount: (p.unit_amount ?? 0) / 100, currency: p.currency }])
  );
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const { db } = await import("./db");
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({ email, metadata: { userId } });

  await db.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customer.id },
    update: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
