import { db } from "@/lib/db";
import { PLANS, stripe } from "@/lib/stripe";
import BillingDiagnosticsClient from "./BillingDiagnosticsClient";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const [subscriptions, recentEvents] = await Promise.all([
    db.subscription.findMany({
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    stripe.events.list({
      limit: 30,
      types: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
        "customer.subscription.trial_will_end",
      ],
    }).catch(() => ({ data: [], has_more: false })),
  ]);

  const planMap = Object.fromEntries(PLANS.map((p) => [p.priceId, p]));

  const subs = subscriptions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name,
    userEmail: s.user.email,
    status: s.status,
    stripePriceId: s.stripePriceId,
    stripeCustomerId: s.stripeCustomerId,
    stripeSubscriptionId: s.stripeSubscriptionId,
    planName: s.stripePriceId ? (planMap[s.stripePriceId]?.name ?? "Unknown") : "Free",
    planPrice: s.stripePriceId ? (planMap[s.stripePriceId]?.price ?? 0) : 0,
    currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
    trialUsed: s.trialUsed,
    updatedAt: s.updatedAt.toISOString(),
  }));

  const events = recentEvents.data.map((e) => ({
    id: e.id,
    type: e.type,
    created: e.created,
    livemode: e.livemode,
    objectId: ((e.data.object as unknown as Record<string, unknown>)?.id as string | null) ?? null,
    customerId: ((e.data.object as unknown as Record<string, unknown>)?.customer as string | null) ?? null,
  }));

  const envDiagnostics = {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER ?? process.env.STRIPE_PRICE_BASIC ?? "",
    STRIPE_PRICE_PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL ?? process.env.STRIPE_PRICE_PRO ?? "",
    STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
    liveMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ?? false,
  };

  const planConfig = PLANS.filter((p) => p.priceId).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    priceId: p.priceId,
    configured: !!p.priceId,
  }));

  return (
    <BillingDiagnosticsClient
      subscriptions={subs}
      events={events}
      envDiagnostics={envDiagnostics}
      planConfig={planConfig}
    />
  );
}
