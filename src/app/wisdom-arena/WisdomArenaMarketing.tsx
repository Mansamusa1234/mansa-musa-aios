"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const AGENTS = [
  { name: "Visionary", icon: "🔮", role: "Big-picture strategy" },
  { name: "Researcher", icon: "🧠", role: "Evidence & data" },
  { name: "Legal Analyst", icon: "⚖️", role: "Risk & compliance" },
  { name: "Finance Expert", icon: "💰", role: "ROI & economics" },
  { name: "Strategist", icon: "🎯", role: "Execution planning" },
  { name: "Devil's Advocate", icon: "😈", role: "Challenges every claim" },
];

const STAGES = [
  { n: "01", title: "Initial answers", desc: "All 6 agents respond to your question independently." },
  { n: "02", title: "Peer critique", desc: "Each agent reads all other answers and challenges weak reasoning." },
  { n: "03", title: "Improved answers", desc: "Agents revise their positions based on the critique." },
  { n: "04", title: "Wisdom Judge scoring", desc: "An impartial AI judge scores each agent 0–100 on evidence, logic, and practicality." },
  { n: "05", title: "Synthesis", desc: "The best elements from all agents are synthesised into one definitive answer." },
];

const USECASES = [
  { q: "Should we raise prices by 20% this quarter?", cat: "Strategy" },
  { q: "Is now the right time to hire a Head of Sales?", cat: "Operations" },
  { q: "What are the biggest risks in our Series A pitch deck?", cat: "Finance" },
  { q: "Should we build or buy this feature?", cat: "Product" },
  { q: "Which market should we expand into first: US or EU?", cat: "Growth" },
  { q: "Is our current marketing spend generating positive ROI?", cat: "Marketing" },
];

const COMPETITION = [
  { label: "Agents in panel", value: "6" },
  { label: "Debate rounds", value: "3" },
  { label: "Max score", value: "100" },
  { label: "Output format", value: "Synthesis + full scoreboard" },
];

export default function WisdomArenaMarketing() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700">
            🏟️ Wisdom Arena — Multi-Agent Debate System
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Six AI minds.<br />
            <span className="text-indigo-600">One right answer.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-500 leading-relaxed">
            Put your hardest business decisions in front of a panel of six specialist AI agents. They debate, critique, and score each other — then synthesise the best possible answer.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              Try Wisdom Arena free →
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-gray-200 px-8 py-4 text-base font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
              See how it works
            </Link>
          </div>
        </motion.div>

        {/* Agent panel visual */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <p className="mb-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Debate panel</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AGENTS.map((a) => (
                <div key={a.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <span className="text-2xl">{a.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-left">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Your question</p>
              <p className="text-sm font-semibold text-gray-800">&ldquo;Should we raise prices by 20% this quarter?&rdquo;</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">The process</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">5 stages. One definitive answer.</h2>
          </motion.div>
          <div className="space-y-6">
            {STAGES.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-5 items-start"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200">
                  <span className="text-xs font-extrabold text-indigo-600">{s.n}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-bold text-gray-900">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="px-6 py-12 border-y border-gray-100">
        <div className="mx-auto max-w-4xl grid grid-cols-2 gap-4 sm:grid-cols-4">
          {COMPETITION.map((c) => (
            <div key={c.label} className="text-center">
              <p className="text-2xl font-extrabold text-indigo-600">{c.value}</p>
              <p className="mt-1 text-xs text-gray-500">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Example questions</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Your hardest questions. Answered properly.</h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USECASES.map((u, i) => (
              <motion.div
                key={u.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-default"
              >
                <span className="mb-2 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">{u.cat}</span>
                <p className="text-sm font-semibold text-gray-800 leading-relaxed">&ldquo;{u.q}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Also: Competition System */}
      <section className="bg-gray-900 px-6 py-20">
        <div className="mx-auto max-w-4xl grid gap-12 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Also in MansaMusaAI</p>
            <h2 className="mt-2 text-3xl font-extrabold text-white">AI Competition System</h2>
            <p className="mt-3 text-gray-400 leading-relaxed">
              Run 24 specialist agents simultaneously on any business prompt. An AI judge scores every response. The winner&apos;s output becomes a permanent <strong className="text-white">Wisdom Asset</strong> — searchable, rateable, forever.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-gray-400">
              {["24 agents, 8 categories (News, Finance, Research, Coding, Marketing, Sales, Strategy, Ops)",
                "Scores 0–100 with judge rationale for every agent",
                "Winning answers saved to your Wisdom Vault",
                "Lifetime leaderboard — see which agents win most",
              ].map((b) => (
                <li key={b} className="flex gap-2 items-start">
                  <span className="text-indigo-400 flex-shrink-0 mt-0.5">✓</span> {b}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all"
            >
              Start your first competition →
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Competition results</p>
            {[
              { name: "Investment Strategist", score: 94, winner: true },
              { name: "Risk Analyst", score: 87, winner: false },
              { name: "Portfolio Optimizer", score: 81, winner: false },
            ].map((r) => (
              <div key={r.name} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-300">{r.name} {r.winner && <span className="text-xs text-yellow-400">🏆 Winner</span>}</span>
                  <span className="text-sm font-bold text-white">{r.score}/100</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${r.winner ? "bg-yellow-400" : "bg-indigo-500"}`} style={{ width: `${r.score}%` }} />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center bg-indigo-600">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="text-4xl font-extrabold text-white">Stop guessing. Start knowing.</h2>
          <p className="mt-4 text-indigo-100">Free forever. Upgrade to unlock more agents and competitions.</p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
          >
            Try Wisdom Arena free →
          </Link>
          <p className="mt-4 text-sm text-indigo-200">No credit card required · Free forever plan</p>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
}
