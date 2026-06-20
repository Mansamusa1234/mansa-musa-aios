import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, getLivePrices } from "@/lib/stripe";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing | MansaMusaAI",
  description: "Manage your MansaMusaAI subscription and billing details.",
  robots: { index: false },
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; canceled?: string }> }) {
  const { success, canceled } = await searchParams;
  const session = await auth();
  const [subscription, livePrices] = await Promise.all([
    db.subscription.findUnique({ where: { userId: session!.user.id } }),
    getLivePrices().catch(() => ({} as Record<string, { amount: number; currency: string }>)),
  ]);

  const plans = PLANS.map((plan) => {
    const live = plan.priceId ? livePrices[plan.priceId] : null;
    return live ? { ...plan, price: live.amount, currency: live.currency } : plan;
  });

  const isTrialing = subscription?.status === "TRIALING";
  const trialEndsAt = subscription?.trialEndsAt ?? null;
  const trialUsed = subscription?.trialUsed ?? false;

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Billing &amp; Plans</h1>
      <p className="mt-1 text-sm text-gray-400">Manage your subscription and payment details.</p>

      {success === "true" && (
        <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4">
          <p className="text-sm font-semibold text-green-300">🎉 Payment successful — your plan is now active!</p>
          <p className="text-xs text-gray-400 mt-0.5">It may take a moment to reflect. Refresh if needed.</p>
        </div>
      )}
      {canceled === "true" && (
        <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4">
          <p className="text-sm font-semibold text-yellow-300">Checkout cancelled — no charge was made.</p>
        </div>
      )}

      {isTrialing && trialDaysLeft !== null && (
        <div className="mt-6 rounded-xl border border-brand-500/30 bg-brand-500/10 px-5 py-4">
          <p className="text-sm font-semibold text-brand-300">
            🎉 Free trial active — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Upgrade before your trial ends to keep access to all features.
          </p>
        </div>
      )}

      {!trialUsed && !isTrialing && subscription?.status !== "ACTIVE" && (
        <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-300">Start your 14-day free trial</p>
            <p className="text-xs text-gray-400 mt-0.5">Full Professional access. No credit card required.</p>
          </div>
          <form action="/api/subscription/start-trial" method="POST">
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Start free trial
            </button>
          </form>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, i) => (
          <BillingClient
            key={plan.id}
            plan={plan}
            currentPriceId={subscription?.stripePriceId ?? null}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
