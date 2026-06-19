import Stripe from "stripe";
import type { PricingPlan } from "@/types";

const STRIPE_API_VERSION = "2025-02-24.acacia";

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

export function getStripe(): Stripe | null {
  const apiKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!apiKey) return null;

  if (!stripeClient || stripeClientKey !== apiKey) {
    stripeClient = new Stripe(apiKey, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
    stripeClientKey = apiKey;
  }

  return stripeClient;
}

export function requireStripe(): Stripe {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  return stripe;
}

export const stripe = requireStripe();

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "gbp",
    priceId: "",
    description: "Get started for free",
    features: ["5 chats / day", "Claude Haiku 4.5", "Chat history (7 days)"],
    highlighted: false,
    messagesPerMonth: Infinity,
    messagesPerDay: 5,
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    currency: "gbp",
    priceId: process.env.STRIPE_PRICE_STARTER ?? process.env.STRIPE_PRICE_BASIC ?? "",
    description: "For small businesses",
    features: [
      "1 AI receptionist",
      "Up to 200 calls / month",
      "Appointment booking",
      "Lead capture & CRM",
      "Email support",
    ],
    highlighted: false,
    messagesPerMonth: Infinity,
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    currency: "gbp",
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL ?? process.env.STRIPE_PRICE_PRO ?? "",
    description: "For growing businesses",
    features: [
      "3 AI receptionists",
      "Unlimited calls",
      "CRM + WhatsApp integration",
      "Email automation sequences",
      "Affiliate programme access",
      "Priority support",
    ],
    highlighted: true,
    messagesPerMonth: Infinity,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    currency: "gbp",
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
    description: "For larger teams",
    features: [
      "Unlimited AI receptionists",
      "Unlimited calls",
      "Custom training & branding",
      "Business automation workflows",
      "SSO / SAML",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    highlighted: false,
    messagesPerMonth: Infinity,
  },
];

/** Fetch live unit_amount + currency from Stripe for all paid plans. */
export async function getLivePrices(): Promise<Record<string, { amount: number; currency: string }>> {
  const stripe = getStripe();
  if (!stripe) return {};

  const paid = PLANS.filter((p) => p.priceId);
  const results = await Promise.all(paid.map((p) => stripe.prices.retrieve(p.priceId)));
  return Object.fromEntries(
    results.map((p) => [p.id, { amount: (p.unit_amount ?? 0) / 100, currency: p.currency }])
  );
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const stripe = requireStripe();
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
