"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CountUp from "@/components/ui/CountUp";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

interface GrowthStats {
  totalReferrals: number;
  convertedReferrals: number;
  totalAffiliates: number;
  convertedAffiliateConversions: number;
  pendingPayoutTotal: number;
  approvedPayoutTotal: number;
  paidPayoutTotal: number;
  pendingApprovalCount: number;
}

interface Props {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  cancelledSubscriptions: number;
  conversionRate: string;
  totalConversations: number;
  totalMessages: number;
  newUsersToday: number;
  messagesThisMonth: number;
  mrr: number;
  arr: number;
  totalTokens: number;
  recentUsers: RecentUser[];
  growth: GrowthStats;
  health: { stripe: boolean; redis: boolean; ai: boolean; database: boolean };
}

function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  sublabel,
  accent,
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sublabel?: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      variants={scaleIn}
      custom={delay}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`rounded-2xl border p-6 transition-colors ${
        accent
          ? "border-brand-500/25 bg-brand-500/10"
          : "border-white/8 bg-white/3"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${accent ? "text-brand-300" : "text-white"}`}>
        {prefix}
        <CountUp value={value} duration={1200} />
        {suffix}
      </p>
      {sublabel && <p className="mt-1 text-xs text-gray-600">{sublabel}</p>}
    </motion.div>
  );
}

function HealthDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`relative flex h-2.5 w-2.5 rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`}>
        {ok && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
        )}
      </span>
      <span className="text-sm text-gray-300">{label}</span>
      <span className={`ml-auto text-xs font-medium ${ok ? "text-green-400" : "text-red-400"}`}>
        {ok ? "Connected" : "Not configured"}
      </span>
    </div>
  );
}

export default function AdminClient({
  totalUsers,
  paidUsers,
  freeUsers,
  cancelledSubscriptions,
  conversionRate,
  totalConversations,
  totalMessages,
  newUsersToday,
  messagesThisMonth,
  mrr,
  arr,
  totalTokens,
  recentUsers,
  growth,
  health,
}: Props) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time platform overview</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          <span className="text-xs font-semibold text-green-400">All systems operational</span>
        </div>
      </motion.div>

      {/* Revenue */}
      <section>
        <motion.h2 variants={fadeUp} className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">
          Revenue
        </motion.h2>
        <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="MRR" value={mrr} prefix="£" accent sublabel="Monthly recurring revenue" delay={0} />
          <StatCard label="ARR" value={arr} prefix="£" accent sublabel="Annual recurring revenue" delay={1} />
          <StatCard label="Paid users" value={paidUsers} sublabel="Active subscriptions" delay={2} />
          <StatCard label="Churn" value={cancelledSubscriptions} sublabel="Cancelled subscriptions" delay={3} />
        </motion.div>
      </section>

      {/* Users */}
      <section>
        <motion.h2 variants={fadeUp} className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">
          Users
        </motion.h2>
        <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={totalUsers} delay={0} />
          <StatCard label="Free users" value={freeUsers} sublabel="No active subscription" delay={1} />
          <StatCard label="Conversion rate" value={parseFloat(conversionRate)} suffix="%" sublabel="Free → Paid" delay={2} />
          <StatCard label="New today" value={newUsersToday} sublabel="Signed up today" delay={3} />
        </motion.div>
      </section>

      {/* Activity */}
      <section>
        <motion.h2 variants={fadeUp} className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-600">
          AI Activity
        </motion.h2>
        <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total conversations" value={totalConversations} delay={0} />
          <StatCard label="Total messages" value={totalMessages} delay={1} />
          <StatCard label="Messages this month" value={messagesThisMonth} delay={2} />
          <StatCard label="Total tokens" value={totalTokens} delay={3} />
        </motion.div>
      </section>

      {/* Growth */}
      <section>
        <motion.div variants={fadeUp} className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600">Growth</h2>
          <Link href="/admin/commissions" className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Review commissions {growth.pendingApprovalCount > 0 && `(${growth.pendingApprovalCount})`} →
          </Link>
        </motion.div>
        <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Referrals" value={growth.totalReferrals} sublabel={`${growth.convertedReferrals} converted`} delay={0} />
          <StatCard label="Affiliates" value={growth.totalAffiliates} sublabel={`${growth.convertedAffiliateConversions} conversions`} delay={1} />
          <StatCard label="Pending + approved" value={growth.pendingPayoutTotal + growth.approvedPayoutTotal} prefix="£" sublabel="Owed, not yet paid" delay={2} />
          <StatCard label="Paid out" value={growth.paidPayoutTotal} prefix="£" sublabel="Manually marked paid" delay={3} />
        </motion.div>
      </section>

      {/* Bottom row: Health + Recent users */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System health */}
        <motion.div variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="mb-4 text-sm font-bold text-white">System Health</h2>
          <div className="space-y-3">
            <HealthDot ok={health.database} label="Database (Supabase)" />
            <HealthDot ok={health.stripe} label="Stripe Billing" />
            <HealthDot ok={health.ai} label="Anthropic AI API" />
            <HealthDot ok={health.redis} label="Upstash Redis (Rate limiting)" />
          </div>
        </motion.div>

        {/* Recent signups */}
        <motion.div variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="mb-4 text-sm font-bold text-white">Recent Signups</h2>
          <div className="space-y-3">
            {recentUsers.length === 0 && (
              <p className="text-sm text-gray-600">No users yet.</p>
            )}
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold text-brand-300">
                    {(u.name ?? u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{u.name ?? "—"}</p>
                    <p className="text-xs text-gray-600">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  {u.role === "ADMIN" && (
                    <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-300">Admin</span>
                  )}
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
