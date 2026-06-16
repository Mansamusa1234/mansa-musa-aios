"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { AGENTS } from "@/data/agents";
import { stagger, scaleIn, fadeUp } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";
import AgentFeed from "@/components/ui/AgentFeed";

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  _count: { messages: number };
}

interface Props {
  totalConversations: number;
  totalMessages: number;
  recentConversations: Conversation[];
  userName: string;
}

const SIMULATED_DEPLOYED = ["document", "support", "finance-analyst", "market-research", "sales", "marketing", "seo", "hr"];

const STATUS_CLASSES: Record<string, string> = {
  Running:  "text-green-400 bg-green-500/15 border-green-500/30",
  Working:  "text-brand-400 bg-brand-500/15 border-brand-500/30",
  Idle:     "text-gray-500 bg-gray-500/10 border-gray-500/20",
};

function fakeStatus(id: string): "Running" | "Working" | "Idle" {
  const h = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  if (h % 3 === 0) return "Running";
  if (h % 3 === 1) return "Working";
  return "Idle";
}

export default function AgentDashboardContent({ totalConversations, totalMessages, userName }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const deployedAgents = AGENTS.filter((a) => SIMULATED_DEPLOYED.includes(a.id));

  const stats = [
    { label: "Deployed agents", value: deployedAgents.length, suffix: "", color: "text-brand-400" },
    { label: "Total conversations", value: totalConversations, suffix: "", color: "text-blue-400" },
    { label: "Messages processed", value: totalMessages, suffix: "", color: "text-green-400" },
    { label: "Avg accuracy", value: 95, suffix: "%", color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Agent Workspace ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {deployedAgents.length} agents active · monitoring your business 24/7
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`text-2xl font-extrabold ${s.color}`}>
                <CountUp value={s.value} suffix={s.suffix} duration={1200} />
              </p>
              <p className="mt-1 text-xs text-gray-600">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Deployed agents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Deployed Agents ({deployedAgents.length})</h2>
            <div className="flex gap-1 rounded-lg border border-white/8 bg-white/3 p-1">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    view === v ? "bg-brand-500 text-white" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={view === "grid" ? "grid gap-3 sm:grid-cols-2" : "space-y-2"}>
            {deployedAgents.map((agent) => {
              const status = fakeStatus(agent.id);
              const tasks = Math.floor(agent.metrics.tasks / 100);
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className={`rounded-xl border border-white/8 bg-white/3 ${view === "grid" ? "p-4" : "flex items-center gap-4 p-3"} hover:border-white/12 transition-colors`}
                >
                  <div className={`${view === "list" ? "flex items-center gap-3 flex-1" : ""}`}>
                    <div className={`flex items-center gap-3 ${view === "grid" ? "mb-3" : ""}`}>
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${agent.bg} text-xl`}>
                        {agent.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{agent.name}</p>
                        <p className="text-[10px] text-gray-600 truncate">{agent.role}</p>
                      </div>
                    </div>
                    {view === "grid" && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="rounded-lg border border-white/6 bg-white/2 p-2 text-center">
                          <p className="text-xs font-bold text-white">{tasks}</p>
                          <p className="text-[9px] text-gray-600">Tasks today</p>
                        </div>
                        <div className="rounded-lg border border-white/6 bg-white/2 p-2 text-center">
                          <p className="text-xs font-bold text-green-400">{agent.metrics.accuracy}%</p>
                          <p className="text-[9px] text-gray-600">Accuracy</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center ${view === "grid" ? "justify-between" : "gap-3 flex-shrink-0"}`}>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASSES[status]}`}>
                      {status}
                    </span>
                    <Link
                      href={`/chat?agent=${agent.id}`}
                      className="text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Run →
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <Link
            href="/marketplace"
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-4 text-sm text-gray-600 hover:border-brand-500/30 hover:text-brand-400 transition-colors"
          >
            <span className="text-lg">+</span> Deploy more agents from Marketplace
          </Link>
        </div>

        {/* Live feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white">Live Activity</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <AgentFeed maxItems={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
