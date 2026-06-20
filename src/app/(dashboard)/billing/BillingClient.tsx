"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PricingPlan } from "@/types";
import { scaleIn } from "@/lib/motion";

interface Props {
  plan: PricingPlan;
  currentPriceId: string | null;
  currentPrice: number;
  index: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  subscriptionId: string | null;
}

export default function BillingClient({
  plan,
  currentPriceId,
  currentPrice,
  index,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  subscriptionId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(cancelAtPeriodEnd);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isCurrent = plan.priceId ? currentPriceId === plan.priceId : !currentPriceId;
  const isUpgrade = plan.price > currentPrice;
  const isDowngrade = plan.price < currentPrice && plan.price > 0;
  const hasActiveSub = !!subscriptionId && currentPriceId !== null;

  const endsAt = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  function getButtonLabel() {
    if (loading) return "Please wait…";
    if (isCurrent) return cancelled ? "Reactivate plan" : "Current plan";
    if (!plan.priceId) return "Free plan";
    if (isUpgrade) return `Upgrade to ${plan.name}`;
    if (isDowngrade) return `Downgrade to ${plan.name}`;
    return `Switch to ${plan.name}`;
  }

  async function handleCheckout() {
    if (!plan.priceId) return;
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not start checkout. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError");
      setError(isAbort ? "Request timed out. Please try again." : "Connection error. Please try again.");
      setLoading(false);
    }
  }

  async function handleChangePlan() {
    if (!plan.priceId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.location.reload();
      } else {
        setError(data.error ?? "Could not change plan. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  async function handleCancel() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCancelled(true);
        setShowCancelConfirm(false);
      } else {
        setError(data.error ?? "Could not cancel. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReactivate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/reactivate", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCancelled(false);
      } else {
        setError(data.error ?? "Could not reactivate. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleButtonClick() {
    if (!plan.priceId) return;
    if (isCurrent && cancelled) return handleReactivate();
    if (hasActiveSub) return handleChangePlan();
    return handleCheckout();
  }

  const price =
    plan.price === 0
      ? "Free"
      : new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: plan.currency.toUpperCase(),
          minimumFractionDigits: 0,
        }).format(plan.price);

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md ${
        plan.highlighted
          ? "border-brand-400 bg-gradient-to-b from-brand-500 to-brand-600 text-white"
          : isCurrent
          ? "border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10"
          : "border-gray-200 dark:border-white/8 bg-white dark:bg-white/5"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-600 shadow-sm">
            Most popular
          </span>
        </div>
      )}

      {isCurrent && !plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${cancelled ? "bg-amber-500 text-white" : "bg-brand-500 text-white"}`}>
            {cancelled ? "Cancels soon" : "Current plan"}
          </span>
        </div>
      )}

      <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlighted ? "text-brand-100" : "text-brand-600"}`}>
        {plan.name}
      </p>

      <div className="mt-3 flex items-end gap-1">
        <span className={`text-3xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"}`}>
          {price}
        </span>
        {plan.price > 0 && (
          <span className={`mb-1 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-400"}`}>/mo</span>
        )}
      </div>

      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs">
            <span className={plan.highlighted ? "text-brand-100" : "text-brand-500"}>✓</span>
            <span className={plan.highlighted ? "text-brand-50" : "text-gray-400 dark:text-gray-400"}>{f}</span>
          </li>
        ))}
      </ul>

      {cancelled && isCurrent && endsAt && (
        <p className={`mt-3 text-xs ${plan.highlighted ? "text-brand-100" : "text-amber-400"}`}>
          Access until {endsAt}
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      {/* Main action button */}
      <button
        onClick={handleButtonClick}
        disabled={loading || (!plan.priceId && !isCurrent) || (isCurrent && !cancelled)}
        className={`mt-6 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
          isCurrent && !cancelled
            ? "cursor-not-allowed bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
            : plan.highlighted
            ? "bg-white text-brand-600 hover:bg-brand-50 shadow-md"
            : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-500/40 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-700 dark:hover:text-brand-400"
        } disabled:opacity-50`}
      >
        {getButtonLabel()}
      </button>

      {/* Cancel subscription — only shown on the current paid plan when not already cancelling */}
      {isCurrent && plan.price > 0 && !cancelled && (
        <>
          {showCancelConfirm ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 space-y-2">
              <p className="text-xs text-red-300">
                Your subscription will remain active until {endsAt ?? "the end of the billing period"}, then cancel.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? "Cancelling…" : "Yes, cancel"}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 rounded-lg border border-white/10 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Keep plan
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className={`mt-2 text-xs ${plan.highlighted ? "text-brand-200 hover:text-white" : "text-gray-500 hover:text-red-400"} transition-colors`}
            >
              Cancel subscription
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
