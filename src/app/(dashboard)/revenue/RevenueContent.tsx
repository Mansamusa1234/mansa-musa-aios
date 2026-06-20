"use client";

import { motion } from "framer-motion";
import { stagger, scaleIn, fadeUp } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

interface PlanBreakdown {
  name: string;
  price: number;
  count: number;
  revenue: number;
}

interface Props {
  mrr: number;
  arr: number;
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  cancelledSubs: number;
  growthRate: string;
  churnRate: string;
  arpu: number;
  newThisMonth: number;
  planBreakdown: PlanBreakdown[];
  mrrHistory: { month: string; mrr: number }[];
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-24 w-full items-end justify-center rounded-t-md overflow-hidden bg-white/4">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className={`w-full ${color}`}
        />
        <span className="absolute top-1 text-[9px] font-bold text-white/80">£{(value / 1000).toFixed(1)}k</span>
      </div>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

export default function RevenueContent({
  mrr, arr, totalUsers, paidUsers, freeUsers, cancelledSubs,
  growthRate, churnRate, arpu, newThisMonth, planBreakdown, mrrHistory,
}: Props) {
  const maxMrr = Math.max(...mrrHistory.map((h) => h.mrr), mrr, 1);
  const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : "0.0";

  const TOP_METRICS = [
    { label: "MRR",            value: mrr,          prefix: "£", suffix: "",    color: "text-brand-400",  desc: "Monthly recurring revenue" },
    { label: "ARR",            value: arr,          prefix: "£", suffix: "",    color: "text-green-400",  desc: "Annual run rate" },
    { label: "ARPU",           value: arpu,         prefix: "£", suffix: "/mo", color: "text-blue-400",   desc: "Avg revenue per user" },
    { label: "Paid users",     value: paidUsers,    prefix: "",  suffix: "",    color: "text-purple-400", desc: "Active subscriptions" },
    { label: "Growth rate",    value: Number(growthRate), prefix: "", suffix: "%", color: Number(growthRate) >= 0 ? "text-green-400" : "text-red-400", desc: "MoM user growth" },
    { label: "Churn rate",     value: Number(churnRate),  prefix: "", suffix: "%", color: Number(churnRate) > 5 ? "text-red-400" : "text-green-400",   desc: "Subscription churn" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Admin · Revenue ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Revenue Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time financial metrics and subscription analytics</p>
        </motion.div>

        {/* Top metrics */}
        <motion.div variants={stagger} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TOP_METRICS.map((m) => (
            <motion.div key={m.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`text-xl font-extrabold ${m.color}`}>
                {m.prefix}<CountUp value={m.value} suffix={m.suffix} duration={1400} />
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-white">{m.label}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">{m.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* MRR bar chart */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold text-white mb-3">MRR History</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="grid gap-2 items-end h-36" style={{ gridTemplateColumns: `repeat(${mrrHistory.length + 1}, minmax(0, 1fr))` }}>
              {mrrHistory.map((h) => (
                <Bar key={h.month} label={h.month} value={h.mrr} max={maxMrr} color="bg-brand-500/60" />
              ))}
              <Bar label="Now" value={mrr} max={maxMrr} color="bg-brand-400" />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
              <div>
                <p className="text-xs text-gray-400">This month</p>
                <p className="text-lg font-extrabold text-brand-400">£{mrr.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Projected ARR</p>
                <p className="text-lg font-extrabold text-green-400">£{arr.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User breakdown */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3">User Breakdown</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
            {[
              { label: "Total users",     value: totalUsers,    color: "bg-gray-400"   },
              { label: "Paid users",      value: paidUsers,     color: "bg-brand-400"  },
              { label: "Free users",      value: freeUsers,     color: "bg-blue-400"   },
              { label: "Cancelled",       value: cancelledSubs, color: "bg-red-400"    },
              { label: "New this month",  value: newThisMonth,  color: "bg-green-400"  },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="font-bold text-white">{row.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: totalUsers > 0 ? `${Math.min((row.value / totalUsers) * 100, 100)}%` : "0%" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${row.color}`}
                  />
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-xl border border-white/6 bg-white/2 p-3 text-center">
              <p className="text-xs text-gray-400">Conversion rate</p>
              <p className="text-xl font-extrabold text-brand-400">{conversionRate}%</p>
              <p className="text-[10px] text-gray-400">free → paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan breakdown */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Revenue by Plan</h2>
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <div className="grid grid-cols-4 border-b border-white/6 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span>Plan</span>
            <span>Price / mo</span>
            <span>Subscribers</span>
            <span>MRR</span>
          </div>
          {planBreakdown.map((p, i) => {
            const pct = mrr > 0 ? (p.revenue / mrr) * 100 : 0;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="grid grid-cols-4 items-center border-b border-white/4 px-5 py-4 last:border-0 hover:bg-white/2 transition-colors"
              >
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-sm text-gray-400">£{p.price}/mo</p>
                <p className="text-sm text-gray-400">{p.count}</p>
                <div>
                  <p className="text-sm font-bold text-green-400">£{p.revenue.toLocaleString()}</p>
                  <div className="mt-1 h-1 w-full max-w-[80px] rounded-full bg-white/6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.08 + 0.2 }}
                      className="h-full rounded-full bg-green-500"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {planBreakdown.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No paid subscriptions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
