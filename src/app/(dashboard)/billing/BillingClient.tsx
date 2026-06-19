"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PricingPlan } from "@/types";
import { scaleIn } from "@/lib/motion";

interface Props {
  plan: PricingPlan;
  currentPriceId: string | null;
  index: number;
}

export default function BillingClient({ plan, currentPriceId, index }: Props) {
  const [loading, setLoading] = useState(false);
  const isCurrent = plan.priceId ? currentPriceId === plan.priceId : !currentPriceId;

  async function handleSubscribe() {
    if (plan.id === "enterprise") {
      window.location.href = "/enterprise";
      return;
    }
    if (!plan.priceId) return;
    setLoading(true);
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: plan.priceId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  const price =
    plan.id === "enterprise"
      ? "Custom"
      : plan.price === 0
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
          <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            Current plan
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
        {plan.price > 0 && plan.id !== "enterprise" && (
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

      <button
        onClick={handleSubscribe}
        disabled={isCurrent || loading || (!plan.priceId && plan.id !== "enterprise")}
        className={`mt-6 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
          isCurrent
            ? "cursor-not-allowed bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
            : plan.highlighted
            ? "bg-white text-brand-600 hover:bg-brand-50 shadow-md"
            : "border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-500/40 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-700 dark:hover:text-brand-400"
        }`}
      >
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : plan.id === "enterprise" ? "Contact sales" : `Upgrade to ${plan.name}`}
      </button>
    </motion.div>
  );
}
