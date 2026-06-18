"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";
import type { PricingPlan } from "@/types";

interface PortalSubscription {
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
  stripePriceId: string | null;
  stripeCustomerId: string | null;
}

interface Props {
  user: { name: string | null; email: string | null };
  subscription: PortalSubscription | null;
  plan: PricingPlan;
  totalMessages: number;
  totalConversations: number;
  messagesThisMonth: number;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-green-500/15 text-green-400 border-green-500/25",
  CANCELED: "bg-red-500/15 text-red-400 border-red-500/25",
  TRIALING: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PortalContent({ user, subscription, plan, totalMessages, totalConversations, messagesThisMonth }: Props) {
  const [portalLoading, setPortalLoading] = useState(false);
  const isActive  = subscription?.status === "ACTIVE";
  const isFree    = !subscription || plan.price === 0;

  async function openBillingPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setPortalLoading(false);
    }
  }
  const renewDate = subscription?.currentPeriodEnd;
  const msgLimit  = plan.messagesPerMonth === Infinity ? null : plan.messagesPerMonth;
  const msgPct    = msgLimit ? Math.min((messagesThisMonth / msgLimit) * 100, 100) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Customer Portal ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            {user.name ? `${user.name}'s Account` : "My Account"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{user.email}</p>
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={stagger} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Current plan",      display: plan.name,                  color: "text-brand-400"  },
            { label: "Total messages",    display: totalMessages.toLocaleString(), color: "text-blue-400"   },
            { label: "Conversations",     display: totalConversations.toLocaleString(), color: "text-green-400"  },
            { label: "Messages this month",display: messagesThisMonth.toLocaleString(), color: "text-amber-400"  },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.display}</p>
              <p className="mt-1 text-xs text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Subscription card */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3">Subscription</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            {/* Plan header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                  {isActive && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES.ACTIVE}`}>
                      Active
                    </span>
                  )}
                  {!isActive && subscription && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[subscription.status] ?? STATUS_STYLES.CANCELED}`}>
                      {subscription.status}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-extrabold text-brand-400">
                  {plan.price === 0 ? "Free" : `£${plan.price}/mo`}
                </p>
              </div>
              {isFree ? (
                <Link
                  href="/billing"
                  className="flex-shrink-0 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors"
                >
                  Upgrade
                </Link>
              ) : (
                <button
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="flex-shrink-0 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors disabled:opacity-50"
                >
                  {portalLoading ? "Opening…" : "Manage billing"}
                </button>
              )}
            </div>

            {/* Features */}
            <ul className="mb-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-green-400 text-xs">✓</span> {f}
                </li>
              ))}
            </ul>

            {/* Renewal / billing */}
            <div className="rounded-xl border border-white/6 bg-white/2 p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Billing period end</span>
                <span className="text-white font-medium">{formatDate(renewDate ?? null)}</span>
              </div>
              {subscription?.stripeCustomerId && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Customer ID</span>
                  <span className="text-gray-400 font-mono text-[10px] truncate max-w-[140px]">
                    {subscription.stripeCustomerId}
                  </span>
                </div>
              )}
              {subscription?.stripeSubscriptionId && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Subscription ID</span>
                  <span className="text-gray-400 font-mono text-[10px] truncate max-w-[140px]">
                    {subscription.stripeSubscriptionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage card */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3">Usage This Month</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-5">
            {/* Message usage */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Messages used</span>
                <span className="text-sm font-bold text-white">
                  {messagesThisMonth.toLocaleString()}
                  {msgLimit && ` / ${msgLimit.toLocaleString()}`}
                </span>
              </div>
              {msgPct !== null ? (
                <>
                  <div className="h-2 w-full rounded-full bg-white/6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${msgPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${msgPct >= 90 ? "bg-red-500" : msgPct >= 70 ? "bg-amber-500" : "bg-brand-500"}`}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">{msgPct.toFixed(1)}% of monthly limit</p>
                  {msgPct >= 80 && (
                    <div className="mt-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs text-amber-400">
                      Approaching your limit — <Link href="/billing" className="underline">upgrade now</Link> for unlimited messages
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-2.5 text-xs text-green-400">
                  Unlimited messages on {plan.name} plan
                </div>
              )}
            </div>

            {/* All-time stats */}
            <div className="space-y-3 border-t border-white/6 pt-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">All-time messages</span>
                <span className="text-sm font-bold text-white"><CountUp value={totalMessages} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">All-time conversations</span>
                <span className="text-sm font-bold text-white"><CountUp value={totalConversations} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Avg messages / conversation</span>
                <span className="text-sm font-bold text-white">
                  {totalConversations > 0 ? Math.round(totalMessages / totalConversations) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support links */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Help & Support</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: "💬", title: "Live Chat",       sub: "Talk to our team",    href: "/chat",    label: "Open chat"   },
            { icon: "📧", title: "Email Support",   sub: "We reply within 24h", href: "/contact", label: "Send email"  },
            { icon: "⚡", title: "Upgrade Plan",    sub: "Unlock more features",href: "/billing", label: "View plans"  },
          ].map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 p-4 hover:border-brand-500/25 hover:bg-white/5 transition-colors"
            >
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
              <span className="text-xs text-brand-400 flex-shrink-0">{s.label} →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
