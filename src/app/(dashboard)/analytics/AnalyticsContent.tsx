"use client";

import { motion } from "framer-motion";
import { stagger, scaleIn, fadeUp } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

interface Props {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  messagesThisMonth: number;
  totalUsers: number;
  isAdmin: boolean;
}

const MOCK_WEEKLY = [
  { day: "Mon", msgs: 142 },
  { day: "Tue", msgs: 218 },
  { day: "Wed", msgs: 197 },
  { day: "Thu", msgs: 284 },
  { day: "Fri", msgs: 310 },
  { day: "Sat", msgs: 98  },
  { day: "Sun", msgs: 74  },
];

const MODEL_SPLIT = [
  { model: "Claude Opus",   pct: 8,  color: "bg-brand-500" },
  { model: "Claude Sonnet", pct: 62, color: "bg-blue-500"  },
  { model: "Claude Haiku",  pct: 30, color: "bg-green-500" },
];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function AnalyticsContent({
  totalConversations,
  totalMessages,
  totalTokens,
  newUsersToday,
  newUsersThisMonth,
  messagesThisMonth,
  totalUsers,
  isAdmin,
}: Props) {
  const maxMsgs  = Math.max(...MOCK_WEEKLY.map((d) => d.msgs));
  const avgPerDay = totalMessages > 0 ? Math.round(totalMessages / 30) : 0;

  const TOP_STATS = [
    { label: "Total conversations", value: totalConversations, suffix: "",    color: "text-brand-400",  desc: isAdmin ? "All users" : "Your chats"   },
    { label: "Total messages",      value: totalMessages,      suffix: "",    color: "text-blue-400",   desc: isAdmin ? "Platform-wide" : "Your messages" },
    { label: "Tokens used",         value: totalTokens,        suffix: "",    color: "text-green-400",  desc: "Input + output tokens", format: formatTokens },
    { label: "This month",          value: messagesThisMonth,  suffix: "",    color: "text-amber-400",  desc: "Messages in current month" },
    ...(isAdmin ? [
      { label: "New today",    value: newUsersToday,    suffix: "",    color: "text-purple-400", desc: "Users joined today" },
      { label: "New this month",value: newUsersThisMonth,suffix: "",   color: "text-teal-400",   desc: "Users joined this month" },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">
            {isAdmin ? "· Admin · " : "· "}Analytics ·
          </p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Usage Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? `Platform-wide insights · ${totalUsers.toLocaleString()} total users`
              : "Your personal usage breakdown"}
          </p>
        </motion.div>

        {/* Top stats */}
        <motion.div variants={stagger} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TOP_STATS.map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`text-xl font-extrabold ${s.color}`}>
                {s.format ? s.format(s.value) : <CountUp value={s.value} suffix={s.suffix} duration={1200} />}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-white">{s.label}</p>
              <p className="mt-0.5 text-[10px] text-gray-600">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Weekly messages chart */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold text-white mb-3">Messages — Last 7 Days (simulated)</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="flex items-end justify-between gap-2 h-32">
              {MOCK_WEEKLY.map((d) => {
                const h = maxMsgs > 0 ? (d.msgs / maxMsgs) * 100 : 0;
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div className="relative flex w-full items-end justify-center rounded-t-sm overflow-hidden bg-white/4" style={{ height: 96 }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="w-full bg-brand-500/60 hover:bg-brand-400 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] text-gray-600">{d.day}</span>
                    <span className="text-[9px] text-gray-700">{d.msgs}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
              <div>
                <p className="text-xs text-gray-600">Daily average (30d)</p>
                <p className="text-lg font-extrabold text-brand-400">{avgPerDay.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Total this month</p>
                <p className="text-lg font-extrabold text-blue-400"><CountUp value={messagesThisMonth} /></p>
              </div>
            </div>
          </div>
        </div>

        {/* Model breakdown */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3">Model Usage Split</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
            {MODEL_SPLIT.map((m) => (
              <div key={m.model}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-gray-300 font-medium">{m.model}</span>
                  <span className="font-bold text-white">{m.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${m.color}`}
                  />
                </div>
              </div>
            ))}

            {/* Token summary */}
            <div className="mt-2 rounded-xl border border-white/6 bg-white/2 p-3 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">Total tokens</span>
                <span className="font-bold text-white">{formatTokens(totalTokens)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">Avg / conversation</span>
                <span className="font-bold text-white">
                  {totalConversations > 0 ? formatTokens(Math.round(totalTokens / totalConversations)) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">Avg / message</span>
                <span className="font-bold text-white">
                  {totalMessages > 0 ? formatTokens(Math.round(totalTokens / totalMessages)) : "—"}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-3 rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-[10px] text-gray-600 mb-2 uppercase tracking-widest font-bold">Platform Growth</p>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Total users</span>
                <span className="text-sm font-bold text-white"><CountUp value={totalUsers} /></span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Joined today</span>
                <span className="text-sm font-bold text-green-400"><CountUp value={newUsersToday} /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">This month</span>
                <span className="text-sm font-bold text-brand-400"><CountUp value={newUsersThisMonth} /></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
