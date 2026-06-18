"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import { CATEGORY_META } from "@/lib/wisdomAgents";
import Link from "next/link";

type Category = keyof typeof CATEGORY_META;
const ALL = "ALL" as const;

interface AgentCard {
  id: string; name: string; slug: string; category: string;
  description: string; icon: string; color: string; planGate: string;
  deployed: boolean; wins: number; totalSessions: number;
  winRate: number; accuracyScore: number; avgRating: number;
}

interface Props { catalog: AgentCard[]; deployedCount: number }

export default function MarketplaceContent({ catalog, deployedCount: _deployedCount }: Props) {
  const [filter, setFilter] = useState<Category | typeof ALL>(ALL);
  const [query, setQuery] = useState("");
  const [deploying, setDeploying] = useState<string | null>(null);
  const [localDeployed, setLocalDeployed] = useState<Set<string>>(
    () => new Set(catalog.filter((a) => a.deployed).map((a) => a.id)),
  );

  const categories = Object.keys(CATEGORY_META) as Category[];

  const visible = useMemo(() => {
    let list = filter === ALL ? catalog : catalog.filter((a) => a.category === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return list;
  }, [catalog, filter, query]);

  async function toggleDeploy(agent: AgentCard) {
    setDeploying(agent.id);
    const action = localDeployed.has(agent.id) ? "undeploy" : "deploy";
    try {
      const res = await fetch("/api/marketplace/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, action }),
      });
      if (res.ok) {
        setLocalDeployed((prev) => {
          const next = new Set(prev);
          action === "deploy" ? next.add(agent.id) : next.delete(agent.id);
          return next;
        });
      }
    } finally {
      setDeploying(null);
    }
  }

  const totalDeployed = localDeployed.size;
  const totalWins = catalog.reduce((s, a) => s + a.wins, 0);
  const topAgent = [...catalog].sort((a, b) => b.wins - a.wins)[0];

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Agent Marketplace ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">24 Specialist AI Agents</h1>
          <p className="mt-1 text-sm text-gray-500">Deploy agents. Run competitions. Winning outputs become Wisdom Assets.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/compete" className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
              ⚔️ Run a Competition
            </Link>
            <Link href="/wisdom" className="rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/8 transition-colors">
              💎 Wisdom Vault
            </Link>
            <Link href="/wisdom-leaderboard" className="rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/8 transition-colors">
              🏆 Global Leaderboard
            </Link>
          </div>
        </motion.div>

        <motion.div variants={stagger} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total agents",     val: String(catalog.length), color: "text-brand-400"  },
            { label: "Deployed by you",  val: String(totalDeployed),  color: "text-green-400"  },
            { label: "Competition wins", val: String(totalWins),      color: "text-amber-400"  },
            { label: "Top performer",    val: topAgent?.name.split(" ")[0] ?? "—", color: "text-purple-400" },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`truncate text-lg font-extrabold ${s.color}`}>{s.val}</p>
              <p className="mt-0.5 text-xs text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter(ALL)}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${filter === ALL ? "bg-brand-500 text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"}`}
        >
          All
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${filter === cat ? "text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"}`}
              style={filter === cat ? { backgroundColor: meta.color } : {}}
            >
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="Search agents…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-500/40"
      />

      <AnimatePresence mode="popLayout">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((agent) => {
            const deployed = localDeployed.has(agent.id);
            const isDeploying = deploying === agent.id;
            const meta = CATEGORY_META[agent.category as Category];
            return (
              <motion.div
                key={agent.id}
                variants={scaleIn}
                layout
                className={`relative flex flex-col rounded-2xl border p-5 transition-all hover:border-white/15 ${deployed ? "border-green-500/30 bg-green-500/5" : "border-white/8 bg-white/3"}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${agent.color}25` }}
                    >
                      {agent.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{agent.name}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: `${meta?.color ?? "#6366f1"}20`, color: meta?.color ?? "#6366f1" }}
                      >
                        {meta?.label ?? agent.category}
                      </span>
                    </div>
                  </div>
                  {deployed && <span className="mt-1.5 h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-green-400" />}
                </div>

                <p className="mb-4 flex-1 text-xs leading-relaxed text-gray-500">{agent.description}</p>

                <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-white/6 bg-white/2 p-3">
                  {[
                    { label: "Wins",     val: String(agent.wins) },
                    { label: "Win rate", val: `${agent.winRate}%` },
                    { label: "Accuracy", val: agent.accuracyScore > 0 ? agent.accuracyScore.toFixed(0) : "—" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-sm font-bold text-white">{s.val}</p>
                      <p className="text-[9px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => toggleDeploy(agent)}
                  disabled={isDeploying}
                  className={`w-full rounded-xl py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                    deployed
                      ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      : "border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20"
                  }`}
                >
                  {isDeploying ? "…" : deployed ? "Undeploy" : "Deploy agent"}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">No agents match your search.</p>
      )}
    </div>
  );
}
