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
          ? "border-brand-200 bg-brand-50"
          : "border-gray-200 bg-white"
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
        <span className={`text-3xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
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
            <span className={plan.highlighted ? "text-brand-50" : "text-gray-600"}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={isCurrent || loading || !plan.priceId}
        className={`mt-6 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
          isCurrent
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : plan.highlighted
            ? "bg-white text-brand-600 hover:bg-brand-50 shadow-md"
            : "border border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        }`}
      >
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : `Upgrade to ${plan.name}`}
      </button>
    </motion.div>
  );
}
