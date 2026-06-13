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
    priceId: "",
    description: "Get started for free",
    features: ["20 messages / month", "GPT-3.5 quality", "Chat history (7 days)"],
    highlighted: false,
    messagesPerMonth: 20,
  },
  {
    id: "basic",
    name: "Basic",
    price: 9,
    priceId: process.env.STRIPE_PRICE_BASIC ?? "",
    description: "For individuals",
    features: ["500 messages / month", "Claude Haiku", "Chat history (30 days)", "Email support"],
    highlighted: false,
    messagesPerMonth: 500,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    description: "For power users",
    features: [
      "Unlimited messages",
      "Claude Sonnet",
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
    price: 99,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
    description: "For teams",
    features: [
      "Everything in Pro",
      "Claude Opus",
      "Team workspaces",
      "SSO / SAML",
      "Dedicated support",
      "Custom fine-tuning",
    ],
    highlighted: false,
    messagesPerMonth: Infinity,
  },
];

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
