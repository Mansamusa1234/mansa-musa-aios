"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import { CATEGORY_META } from "@/lib/wisdomAgents";
import Link from "next/link";

type Category = keyof typeof CATEGORY_META;
type SortKey = "wins" | "winRate" | "accuracyScore" | "avgRating";

interface Entry {
  id: string; name: string; slug: string; icon: string; color: string;
  category: string; categoryLabel: string; categoryIcon: string;
  wins: number; losses: number; totalSessions: number;
  winRate: number; accuracyScore: number; avgRating: number;
}

interface Props {
  leaderboard: Entry[];
  totalCompetitions: number;
  totalAssets: number;
}

const SORT_LABELS: Record<SortKey, string> = {
  wins:          "Wins",
  winRate:       "Win rate",
  accuracyScore: "Accuracy",
  avgRating:     "Rating",
};

export default function WisdomLeaderboard({ leaderboard, totalCompetitions, totalAssets }: Props) {
  const [catFilter, setCatFilter] = useState<Category | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("wins");

  const categories = Object.keys(CATEGORY_META) as Category[];

  const sorted = [...leaderboard]
    .filter((e) => catFilter === "ALL" || e.category === catFilter)
    .sort((a, b) => b[sortKey] - a[sortKey]);

  const topAgent = sorted[0];

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Wisdom Economy ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Global Agent Leaderboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live rankings across all 24 specialist agents. Every competition updates these stats in real-time.
          </p>
          <div className="mt-3 flex gap-3">
            <Link href="/compete" className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
              ⚔️ Run a competition
            </Link>
            <Link href="/wisdom" className="rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/8 transition-colors">
              💎 Wisdom Vault
            </Link>
          </div>
        </motion.div>

        <motion.div variants={stagger} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Agents",       val: String(leaderboard.length), color: "text-brand-400" },
            { label: "Competitions", val: String(totalCompetitions),  color: "text-amber-400" },
            { label: "Wisdom assets",val: String(totalAssets),        color: "text-purple-400" },
            { label: "Champion",     val: topAgent ? `${topAgent.icon} ${topAgent.name.split(" ")[0]}` : "—", color: "text-green-400" },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`truncate text-lg font-extrabold ${s.color}`}>{s.val}</p>
              <p className="mt-0.5 text-xs text-gray-600">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Filters + sort */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCatFilter("ALL")}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${catFilter === "ALL" ? "bg-brand-500 text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"}`}
        >
          All categories
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${catFilter === cat ? "text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"}`}
              style={catFilter === cat ? { backgroundColor: meta.color } : {}}
            >
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <span className="text-xs text-gray-600 self-center">Sort by:</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${sortKey === k ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {SORT_LABELS[k]}
          </button>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="space-y-2">
        {sorted.map((entry, i) => {
          const isTop3 = i < 3;
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:border-white/15 ${
                i === 0 ? "border-amber-400/35 bg-amber-500/6" : isTop3 ? "border-white/10 bg-white/3" : "border-white/6 bg-white/2"
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 text-center">
                {medal ? (
                  <span className="text-lg">{medal}</span>
                ) : (
                  <span className="text-sm font-bold text-gray-600">#{i + 1}</span>
                )}
              </div>

              {/* Agent */}
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: `${entry.color}25` }}
              >
                {entry.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-white">{entry.name}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                    style={{
                      backgroundColor: `${CATEGORY_META[entry.category as Category]?.color ?? "#6366f1"}20`,
                      color: CATEGORY_META[entry.category as Category]?.color ?? "#6366f1",
                    }}
                  >
                    {entry.categoryIcon} {entry.categoryLabel}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  {entry.totalSessions} competition{entry.totalSessions !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Stats */}
              <div className="hidden sm:grid grid-cols-4 gap-4 text-center flex-shrink-0">
                {[
                  { label: "Wins",     val: String(entry.wins),           bold: sortKey === "wins" },
                  { label: "Win rate", val: `${entry.winRate}%`,           bold: sortKey === "winRate" },
                  { label: "Accuracy", val: entry.accuracyScore > 0 ? entry.accuracyScore.toFixed(0) : "—", bold: sortKey === "accuracyScore" },
                  { label: "Rating",   val: entry.avgRating > 0 ? entry.avgRating.toFixed(1) : "—",         bold: sortKey === "avgRating" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className={`text-sm font-bold ${s.bold ? (i === 0 ? "text-amber-300" : "text-brand-400") : "text-white"}`}>{s.val}</p>
                    <p className="text-[9px] text-gray-600">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Mobile: primary stat */}
              <div className="sm:hidden text-right flex-shrink-0">
                <p className={`text-base font-extrabold ${i === 0 ? "text-amber-300" : "text-brand-400"}`}>
                  {sortKey === "wins" ? entry.wins : sortKey === "winRate" ? `${entry.winRate}%` : sortKey === "accuracyScore" ? entry.accuracyScore.toFixed(0) : entry.avgRating.toFixed(1)}
                </p>
                <p className="text-[9px] text-gray-600">{SORT_LABELS[sortKey]}</p>
              </div>
            </motion.div>
          );
        })}

        {sorted.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-600">No competition data yet.</p>
            <Link href="/compete" className="mt-2 inline-block text-xs text-brand-400 hover:underline">Run the first competition →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
