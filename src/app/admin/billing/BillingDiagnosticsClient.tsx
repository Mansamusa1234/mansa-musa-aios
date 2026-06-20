"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";

interface SubRow {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  status: string;
  stripePriceId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planName: string;
  planPrice: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  trialUsed: boolean;
  updatedAt: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  objectId: string | null;
  customerId: string | null;
}

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  priceId: string;
  configured: boolean;
}

interface EnvDiagnostics {
  STRIPE_SECRET_KEY: boolean;
  STRIPE_WEBHOOK_SECRET: boolean;
  STRIPE_PRICE_STARTER: string;
  STRIPE_PRICE_PROFESSIONAL: string;
  STRIPE_PRICE_ENTERPRISE: string;
  NEXT_PUBLIC_APP_URL: string;
  liveMode: boolean;
}

interface Props {
  subscriptions: SubRow[];
  events: WebhookEvent[];
  envDiagnostics: EnvDiagnostics;
  planConfig: PlanConfig[];
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-green-500/15 text-green-400 border-green-500/25",
  TRIALING: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  PAST_DUE: "bg-red-500/15 text-red-400 border-red-500/25",
  CANCELED: "bg-gray-500/15 text-gray-400 border-gray-500/25",
  INACTIVE: "bg-gray-500/10 text-gray-600 border-gray-500/15",
};

const EVENT_STYLES: Record<string, string> = {
  "checkout.session.completed":         "text-green-400",
  "customer.subscription.created":      "text-blue-400",
  "customer.subscription.updated":      "text-brand-400",
  "customer.subscription.deleted":      "text-red-400",
  "invoice.payment_succeeded":          "text-green-400",
  "invoice.payment_failed":             "text-red-400",
  "customer.subscription.trial_will_end": "text-amber-400",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts * 1000;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncate(s: string | null, len = 20): string {
  if (!s) return "—";
  return s.length > len ? `…${s.slice(-len)}` : s;
}

export default function BillingDiagnosticsClient({ subscriptions, events, envDiagnostics, planConfig }: Props) {
  const [tab, setTab] = useState<"subscriptions" | "webhooks" | "config">("subscriptions");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const active   = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const trialing = subscriptions.filter((s) => s.status === "TRIALING").length;
  const pastDue  = subscriptions.filter((s) => s.status === "PAST_DUE").length;
  const canceled = subscriptions.filter((s) => s.status === "CANCELED").length;
  const mrr      = subscriptions.filter((s) => s.status === "ACTIVE").reduce((sum, s) => sum + s.planPrice, 0);

  const filtered = subscriptions.filter((s) => {
    const q = filter.toLowerCase();
    return !q || (s.userEmail ?? "").toLowerCase().includes(q) || (s.userName ?? "").toLowerCase().includes(q) || s.status.toLowerCase().includes(q) || s.planName.toLowerCase().includes(q);
  });

  async function testCheckout(priceId: string) {
    setCheckoutLoading(priceId);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        setCheckoutError(data.error ?? "Failed to create checkout session");
      }
    } catch {
      setCheckoutError("Connection error");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const tabs = [
    { key: "subscriptions", label: `Subscriptions (${subscriptions.length})` },
    { key: "webhooks",      label: `Webhook Events (${events.length})` },
    { key: "config",        label: "Config & Diagnostics" },
  ] as const;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">· Admin · Billing ·</p>
        <h1 className="text-2xl font-extrabold text-white">Billing Diagnostics</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time Stripe data and subscription health</p>
      </motion.div>

      {/* Mode banner */}
      {!envDiagnostics.liveMode && (
        <motion.div variants={fadeUp} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-semibold text-amber-300">Test mode — using Stripe test keys. No real charges will occur.</p>
        </motion.div>
      )}
      {envDiagnostics.liveMode && (
        <motion.div variants={fadeUp} className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">🟢</span>
          <p className="text-sm font-semibold text-green-300">Live mode — real Stripe keys active.</p>
        </motion.div>
      )}

      {/* KPI row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Active",   value: active,   color: "text-green-400"  },
          { label: "Trialing", value: trialing, color: "text-blue-400"   },
          { label: "Past due", value: pastDue,  color: "text-red-400"    },
          { label: "Canceled", value: canceled, color: "text-gray-500"   },
          { label: "MRR",      value: `£${mrr.toLocaleString()}`, color: "text-brand-400", raw: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className={`text-2xl font-extrabold ${s.color}`}>{"raw" in s ? s.value : s.value}</p>
            <p className="mt-1 text-xs text-gray-600">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${tab === t.key ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Subscriptions tab */}
      {tab === "subscriptions" && (
        <div className="space-y-3">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by email, name, plan, or status…"
            className="w-full max-w-sm rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50"
          />
          <div className="rounded-2xl border border-white/8 bg-white/3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/6">
                  {["User", "Plan", "Status", "Customer ID", "Subscription ID", "Period end", "Trial", "Updated"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{s.userName ?? "—"}</p>
                      <p className="text-gray-600 mt-0.5">{s.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{s.planName}</p>
                      {s.planPrice > 0 && <p className="text-gray-600">£{s.planPrice}/mo</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`inline-block rounded-full border px-2 py-0.5 font-bold uppercase tracking-wide ${STATUS_STYLES[s.status] ?? STATUS_STYLES.INACTIVE}`}>
                          {s.status}
                        </span>
                        {s.cancelAtPeriodEnd && (
                          <span className="block rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-400">
                            CANCELS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">{truncate(s.stripeCustomerId)}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{truncate(s.stripeSubscriptionId)}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmt(s.currentPeriodEnd)}</td>
                    <td className="px-4 py-3">
                      {s.status === "TRIALING" && s.trialEndsAt ? (
                        <span className="text-blue-400">Ends {fmt(s.trialEndsAt)}</span>
                      ) : s.trialUsed ? (
                        <span className="text-gray-600">Used</span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{timeAgo(new Date(s.updatedAt).getTime() / 1000)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-600">No subscriptions match your filter</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Webhooks tab */}
      {tab === "webhooks" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/8 bg-white/3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/6">
                  {["Event type", "Object ID", "Customer", "When", "Mode", "Event ID"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${EVENT_STYLES[e.type] ?? "text-gray-400"}`}>{e.type}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">{truncate(e.objectId, 22)}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{truncate(e.customerId, 22)}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{timeAgo(e.created)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${e.livemode ? "border-green-500/25 text-green-500" : "border-amber-500/25 text-amber-500"}`}>
                        {e.livemode ? "LIVE" : "TEST"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{truncate(e.id, 24)}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-600">No recent events</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Config & Diagnostics tab */}
      {tab === "config" && (
        <div className="space-y-6">
          {/* Env vars */}
          <div>
            <h2 className="text-sm font-bold text-white mb-3">Environment Variables</h2>
            <div className="rounded-2xl border border-white/8 bg-white/3 divide-y divide-white/5">
              {[
                { key: "STRIPE_SECRET_KEY",      ok: envDiagnostics.STRIPE_SECRET_KEY,      value: envDiagnostics.liveMode ? "sk_live_***" : "sk_test_***" },
                { key: "STRIPE_WEBHOOK_SECRET",   ok: envDiagnostics.STRIPE_WEBHOOK_SECRET,   value: envDiagnostics.STRIPE_WEBHOOK_SECRET ? "whsec_***" : "" },
                { key: "STRIPE_PRICE_STARTER",    ok: !!envDiagnostics.STRIPE_PRICE_STARTER,  value: envDiagnostics.STRIPE_PRICE_STARTER },
                { key: "STRIPE_PRICE_PROFESSIONAL",ok: !!envDiagnostics.STRIPE_PRICE_PROFESSIONAL, value: envDiagnostics.STRIPE_PRICE_PROFESSIONAL },
                { key: "STRIPE_PRICE_ENTERPRISE", ok: !!envDiagnostics.STRIPE_PRICE_ENTERPRISE, value: envDiagnostics.STRIPE_PRICE_ENTERPRISE },
                { key: "NEXT_PUBLIC_APP_URL",     ok: !!envDiagnostics.NEXT_PUBLIC_APP_URL,   value: envDiagnostics.NEXT_PUBLIC_APP_URL },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={row.ok ? "text-green-400" : "text-red-400"}>{row.ok ? "✓" : "✗"}</span>
                    <span className="font-mono text-xs text-gray-300">{row.key}</span>
                  </div>
                  <span className="font-mono text-xs text-gray-600">{row.ok ? (row.value || "set") : "NOT SET"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan configuration */}
          <div>
            <h2 className="text-sm font-bold text-white mb-3">Plan Configuration</h2>
            <div className="rounded-2xl border border-white/8 bg-white/3 divide-y divide-white/5">
              {planConfig.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={p.configured ? "text-green-400" : "text-red-400"}>{p.configured ? "✓" : "✗"}</span>
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                    <span className="text-xs text-gray-500">£{p.price}/mo</span>
                  </div>
                  <span className="font-mono text-xs text-gray-600">{p.priceId || "no price ID"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout test */}
          <div>
            <h2 className="text-sm font-bold text-white mb-1">Test Checkout Flow</h2>
            <p className="text-xs text-gray-600 mb-3">Opens a Stripe checkout session in a new tab using your admin account. Works in test mode only.</p>
            {checkoutError && (
              <p className="mb-3 text-xs text-red-400 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">{checkoutError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {planConfig.filter((p) => p.configured).map((p) => (
                <button
                  key={p.priceId}
                  onClick={() => testCheckout(p.priceId)}
                  disabled={checkoutLoading === p.priceId}
                  className="rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-brand-500/40 hover:text-brand-300 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === p.priceId ? "Opening…" : `Test ${p.name} checkout`}
                </button>
              ))}
              {planConfig.filter((p) => p.configured).length === 0 && (
                <p className="text-xs text-gray-600">No paid plans configured — set STRIPE_PRICE_* env vars first.</p>
              )}
            </div>
          </div>

          {/* Webhook endpoint reminder */}
          <div>
            <h2 className="text-sm font-bold text-white mb-3">Webhook Endpoint</h2>
            <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className={envDiagnostics.STRIPE_WEBHOOK_SECRET ? "text-green-400" : "text-red-400"}>
                  {envDiagnostics.STRIPE_WEBHOOK_SECRET ? "✓" : "✗"}
                </span>
                <span className="text-xs text-gray-300">Webhook secret configured</span>
              </div>
              <p className="font-mono text-xs text-gray-500">{envDiagnostics.NEXT_PUBLIC_APP_URL}/api/stripe/webhook</p>
              <p className="text-xs text-gray-700 mt-2">
                Required events: checkout.session.completed · customer.subscription.* · invoice.payment_succeeded · invoice.payment_failed
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
