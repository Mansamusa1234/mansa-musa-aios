"use client";

import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import AgentCharacter, { AgentCharacterCard } from "@/components/ui/AgentCharacter";
import type { AgentType } from "@/components/ui/AgentCharacter";
import Link from "next/link";

const AGENTS: {
  type: AgentType;
  title: string;
  description: string;
  stats: string;
  href: string;
  available: boolean;
}[] = [
  {
    type: "receptionist",
    title: "AI Receptionist",
    description: "Answers calls, captures leads, books appointments — 24/7 in 30+ languages.",
    stats: "< 2s response · 30+ languages",
    href: "/receptionist",
    available: true,
  },
  {
    type: "sales",
    title: "Sales Agent",
    description: "Qualifies prospects, follows up automatically, and moves leads through your pipeline.",
    stats: "3× more conversions",
    href: "/marketplace",
    available: true,
  },
  {
    type: "support",
    title: "Support Agent",
    description: "Handles customer queries, resolves tickets, and escalates when needed.",
    stats: "70% ticket deflection",
    href: "/marketplace",
    available: true,
  },
  {
    type: "booking",
    title: "Booking Agent",
    description: "Syncs with your calendar and fills your schedule without any back-and-forth.",
    stats: "Zero double-bookings",
    href: "/receptionist",
    available: true,
  },
  {
    type: "marketing",
    title: "Marketing Agent",
    description: "Writes copy, schedules posts, runs email campaigns, and tracks performance.",
    stats: "Coming soon",
    href: "#",
    available: false,
  },
  {
    type: "finance",
    title: "Finance Agent",
    description: "Tracks invoices, chases payments, and produces financial summaries on demand.",
    stats: "Coming soon",
    href: "#",
    available: false,
  },
  {
    type: "research",
    title: "Research Agent",
    description: "Scours the web, compiles reports, and delivers competitive intelligence.",
    stats: "Coming soon",
    href: "#",
    available: false,
  },
  {
    type: "security",
    title: "Security Agent",
    description: "Monitors for anomalies, manages access reviews, and alerts on threats.",
    stats: "Coming soon",
    href: "#",
    available: false,
  },
];

export default function AgentsPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8 max-w-5xl">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· AI Agents ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Your AI Workforce</h1>
          <p className="mt-1 text-sm text-gray-500">
            Each agent runs 24/7, learns your business, and works alongside your team.
          </p>
        </div>
        <Link href="/marketplace" className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
          Browse marketplace →
        </Link>
      </motion.div>

      {/* Character parade */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6 text-center">Your AI team</p>
        <div className="flex flex-wrap justify-center gap-8">
          {AGENTS.filter((a) => a.available).map((a) => (
            <AgentCharacterCard key={a.type} type={a.type} size={72} />
          ))}
        </div>
      </motion.div>

      {/* Agent cards grid */}
      <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {AGENTS.map((agent) => (
          <motion.div
            key={agent.type}
            variants={scaleIn}
            whileHover={agent.available ? { y: -4, transition: { duration: 0.2 } } : undefined}
            className={`relative rounded-2xl border p-5 flex flex-col gap-3 transition-colors ${
              agent.available
                ? "border-white/8 bg-white/3 hover:border-white/15"
                : "border-white/4 bg-white/1 opacity-60"
            }`}
          >
            {!agent.available && (
              <div className="absolute top-3 right-3 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                Soon
              </div>
            )}
            <div className="flex items-start gap-3">
              <AgentCharacter type={agent.type} size={52} animate={agent.available} />
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-sm font-bold text-white leading-tight">{agent.title}</h3>
                <p className="text-[10px] text-brand-400 mt-0.5 font-mono">{agent.stats}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{agent.description}</p>
            {agent.available && (
              <Link
                href={agent.href}
                className="mt-auto rounded-xl border border-white/8 py-2 text-center text-xs font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              >
                Configure →
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
