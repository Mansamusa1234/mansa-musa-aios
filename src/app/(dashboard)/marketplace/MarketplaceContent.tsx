"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useMemo } from "react";
import { AGENTS, AGENT_CATEGORIES, CATEGORY_COLORS, PLAN_COLORS, type AgentCategory, type AgentPlan, PLAN_ORDER } from "@/data/agents";
import { stagger, scaleIn, fadeUp } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

interface Props { userPlan: AgentPlan }

const ALL = "All Agents";

export default function MarketplaceContent({ userPlan }: Props) {
  const [category, setCategory] = useState<AgentCategory | typeof ALL>(ALL);
  const [query, setQuery] = useState("");
  const [deploying, setDeploying] = useState<string | null>(null);
  const [deployed, setDeployed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = category === ALL ? AGENTS : AGENTS.filter((a) => a.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [category, query]);

  const stats = useMemo(() => {
    const active = AGENTS.filter((a) => a.status === "active").length;
    const beta = AGENTS.filter((a) => a.status === "beta").length;
    const free = AGENTS.filter((a) => a.plan === "free").length;
    const tasks = AGENTS.reduce((sum, a) => sum + a.metrics.tasks, 0);
    return [
      { label: "Total agents",    value: AGENTS.length },
      { label: "Categories",      value: AGENT_CATEGORIES.length },
      { label: "Active agents",   value: active },
      { label: "Beta agents",     value: beta },
      { label: "Free to deploy",  value: free },
      { label: "Tasks completed", value: tasks },
    ];
  }, []);

  const canDeploy = (plan: AgentPlan) => PLAN_ORDER[userPlan] >= PLAN_ORDER[plan];

  async function handleDeploy(agentId: string, plan: AgentPlan) {
    if (!canDeploy(plan)) return;
    setDeploying(agentId);
    await new Promise((r) => setTimeout(r, 900));
    setDeployed((prev) => new Set([...prev, agentId]));
    setDeploying(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· AI Agent Marketplace ·</p>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Deploy your AI workforce
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              <CountUp value={AGENTS.length} /> specialist agents across <CountUp value={AGENT_CATEGORIES.length} /> business functions
            </p>
          </div>
          <Link href="/agent-dashboard" className="flex-shrink-0 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors">
            My Agents →
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div variants={fadeUp} className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-white/6 bg-white/3 p-4 sm:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-extrabold text-brand-400"><CountUp value={s.value} /></p>
              <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Search + filter */}
        <motion.div variants={fadeUp} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents by name or capability…"
              className="w-full rounded-xl border border-white/8 bg-white/4 pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-500/40 focus:bg-white/6 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {[ALL, ...AGENT_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat as AgentCategory | typeof ALL)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  category === cat
                    ? "bg-brand-500 text-white"
                    : "border border-white/8 bg-white/3 text-gray-500 hover:text-gray-200 hover:bg-white/6"
                }`}
              >
                {cat === ALL ? `All (${AGENTS.length})` : cat}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Agent grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={category + query}
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.map((agent) => {
            const isDeployed = deployed.has(agent.id);
            const isDeploying = deploying === agent.id;
            const hasAccess = canDeploy(agent.plan);

            return (
              <motion.div
                key={agent.id}
                variants={scaleIn}
                layout
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="group relative flex flex-col rounded-2xl border border-white/8 bg-white/3 p-5 hover:border-brand-500/25 hover:bg-white/5 transition-colors"
              >
                {/* Status dot */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  {agent.status === "active" && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                    </span>
                  )}
                  {agent.status === "beta" && (
                    <span className="rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">BETA</span>
                  )}
                </div>

                {/* Icon */}
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${agent.bg} text-2xl`}>
                  {agent.icon}
                </div>

                {/* Name + category */}
                <div className="mb-2 flex flex-wrap items-start gap-1.5">
                  <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                </div>
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${agent.color}`}>{agent.role}</p>

                {/* Badges */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[agent.category]}`}>
                    {agent.category}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PLAN_COLORS[agent.plan]}`}>
                    {agent.plan.charAt(0).toUpperCase() + agent.plan.slice(1)}+
                  </span>
                </div>

                {/* Description */}
                <p className="mb-4 flex-1 text-xs text-gray-500 leading-relaxed line-clamp-3">{agent.description}</p>

                {/* Capabilities */}
                <div className="mb-4 flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 4).map((c) => (
                    <span key={c} className="rounded-md border border-white/6 bg-white/3 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {c}
                    </span>
                  ))}
                  {agent.capabilities.length > 4 && (
                    <span className="rounded-md border border-white/6 bg-white/3 px-1.5 py-0.5 text-[10px] text-gray-600">
                      +{agent.capabilities.length - 4}
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-white/6 bg-white/2 p-2.5">
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-white">{agent.metrics.tasks.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-600">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-green-400">{agent.metrics.accuracy}%</p>
                    <p className="text-[9px] text-gray-600">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-blue-400">{agent.metrics.avgSec}s</p>
                    <p className="text-[9px] text-gray-600">Avg time</p>
                  </div>
                </div>

                {/* Deploy button */}
                {isDeployed ? (
                  <Link
                    href={`/chat?agent=${agent.id}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-2.5 text-sm font-semibold text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    <span>✓</span> Deployed — Chat now
                  </Link>
                ) : hasAccess ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDeploy(agent.id, agent.plan)}
                    disabled={isDeploying}
                    className="rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
                  >
                    {isDeploying ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Deploying…
                      </span>
                    ) : "Deploy Agent"}
                  </motion.button>
                ) : (
                  <Link
                    href="/billing"
                    className="block rounded-xl border border-brand-500/30 bg-brand-500/10 py-2.5 text-center text-sm font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors"
                  >
                    Upgrade to {agent.plan.charAt(0).toUpperCase() + agent.plan.slice(1)}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-5xl">🔍</div>
          <p className="text-gray-400 font-medium">No agents found for "{query}"</p>
          <button onClick={() => { setQuery(""); setCategory(ALL); }} className="mt-3 text-sm text-brand-400 hover:underline">
            Clear filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
