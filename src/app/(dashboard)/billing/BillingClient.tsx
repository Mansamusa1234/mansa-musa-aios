"use client";

import { useState } from "react";
import type { PricingPlan } from "@/types";

interface Props {
  plan: PricingPlan;
  currentPriceId: string | null;
}

export default function BillingClient({ plan, currentPriceId }: Props) {
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

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col ${
        plan.highlighted
          ? "border-brand-500 bg-brand-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {plan.highlighted && (
        <span className="mb-2 self-start rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
          Most popular
        </span>
      )}
      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
      <div className="mt-2 text-2xl font-extrabold text-gray-900">
        ${plan.price}<span className="text-sm font-normal text-gray-400">/mo</span>
      </div>
      <ul className="mt-4 flex-1 space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
            <span className="text-brand-500">✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={handleSubscribe}
        disabled={isCurrent || loading || !plan.priceId}
        className={`mt-6 rounded-xl py-2 text-sm font-semibold transition-colors ${
          isCurrent
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : plan.highlighted
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "border border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        {isCurrent ? "Current plan" : loading ? "Redirecting…" : `Upgrade to ${plan.name}`}
      </button>
    </div>
  );
}
