"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import { CATEGORY_META } from "@/lib/wisdomAgents";
import Link from "next/link";

type Category = keyof typeof CATEGORY_META;

interface Agent { id: string; name: string; icon: string; color: string; category: string }
interface Entry {
  id: string;
  response: string;
  score: number;
  rank: number;
  rationale: string;
  agent: Agent;
}
interface Competition {
  id: string;
  prompt: string;
  category: string;
  status: string;
  error: string | null;
  entries: Entry[];
  asset: { id: string; title: string } | null;
  completedAt: string | null;
}

const STAGES = ["RUNNING", "SCORING", "DONE"];

export default function CompeteContent() {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<Category>("STRATEGY");
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const categories = Object.keys(CATEGORY_META) as Category[];

  const poll = useCallback(async (id: string) => {
    const res = await fetch(`/api/compete/${id}`);
    if (!res.ok) return;
    const data: Competition = await res.json();
    setCompetition(data);
    if (data.status === "DONE" || data.status === "FAILED") {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (!competition || competition.status === "DONE" || competition.status === "FAILED") return;
    intervalRef.current = setInterval(() => poll(competition.id), 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [competition?.id, competition?.status, poll]);

  async function startCompetition() {
    if (prompt.trim().length < 10) return;
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/compete/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setCompetition({ id: data.competitionId, prompt, category, status: "RUNNING", error: null, entries: [], asset: null, completedAt: null });
    } finally {
      setStarting(false);
    }
  }

  const stageIdx = competition ? STAGES.indexOf(competition.status) : -1;
  const meta = competition ? CATEGORY_META[competition.category as Category] : null;

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Agent Competition ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Pit agents against each other</h1>
          <p className="mt-1 text-sm text-gray-500">Every agent in a category competes simultaneously. The judge scores on accuracy, depth, practicality, and clarity. The winner's output becomes a Wisdom Asset.</p>
        </motion.div>
      </motion.div>

      {!competition ? (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-5">
          {error && <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-2 block text-sm font-bold text-white">Choose category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const m = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${category === cat ? "text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"}`}
                    style={category === cat ? { backgroundColor: m.color } : {}}
                  >
                    {m.icon} {m.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">{CATEGORY_META[category].description}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white">Your prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={`Ask something for ${CATEGORY_META[category].label} agents — e.g. "${EXAMPLE_PROMPTS[category]}"`}
              className="w-full resize-none rounded-xl border border-white/8 bg-white/4 p-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-500/40"
            />
            <p className="mt-1 text-[11px] text-gray-400">{prompt.length}/2000 — 3 agents compete, judge scores all, winner stored as Wisdom Asset</p>
          </div>

          <button
            onClick={startCompetition}
            disabled={starting || prompt.trim().length < 10}
            className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {starting ? "Launching competition…" : "⚔️ Start competition"}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Question card */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{meta?.icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: meta?.color }}>{meta?.label}</span>
            </div>
            <p className="text-sm text-gray-200">{competition.prompt}</p>
          </div>

          {/* Progress */}
          {competition.status !== "FAILED" && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                {STAGES.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full transition-colors ${i < stageIdx ? "bg-green-400" : i === stageIdx ? "bg-brand-400 animate-pulse" : "bg-white/10"}`} />
                    <p className={`mt-1 text-[10px] font-semibold ${i === stageIdx ? "text-brand-300" : "text-gray-400"}`}>
                      {s === "RUNNING" ? "Generating" : s === "SCORING" ? "Judging" : "Done"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/6">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-300"
                  animate={{ width: `${((stageIdx + 1) / STAGES.length) * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          )}

          {competition.status === "FAILED" && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              Competition failed. {competition.error}
            </div>
          )}

          {/* Results */}
          {competition.entries.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold text-white">
                {competition.status === "DONE" ? "Final Results" : "Responses so far"}
              </h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {competition.entries.map((entry, i) => {
                    const isWinner = competition.status === "DONE" && entry.rank === 1;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-2xl border p-4 ${isWinner ? "border-amber-400/40 bg-amber-500/8 shadow-[0_0_20px_-4px_rgba(251,191,36,0.3)]" : "border-white/8 bg-white/3"}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{entry.agent.icon}</span>
                            <span className="text-sm font-bold text-white">{entry.agent.name}</span>
                            {isWinner && (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                                🏆 WINNER
                              </motion.span>
                            )}
                          </div>
                          {entry.score > 0 && (
                            <span className={`text-sm font-extrabold ${isWinner ? "text-amber-300" : "text-brand-400"}`}>
                              {entry.score}/100
                            </span>
                          )}
                        </div>
                        {entry.score > 0 && (
                          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${entry.score}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`h-full rounded-full ${isWinner ? "bg-gradient-to-r from-amber-400 to-amber-300" : "bg-brand-500"}`}
                            />
                          </div>
                        )}
                        <p className="text-xs leading-relaxed text-gray-400 whitespace-pre-wrap line-clamp-6">
                          {entry.response}
                        </p>
                        {entry.rationale && (
                          <p className="mt-2 text-[11px] italic text-gray-400">{entry.rationale}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Wisdom Asset created */}
          {competition.asset && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5"
            >
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-400">💎 Wisdom Asset Created</p>
              <p className="text-sm font-bold text-white">{competition.asset.title}</p>
              <Link
                href={`/wisdom/${competition.asset.id}`}
                className="mt-3 inline-block rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
              >
                View in Wisdom Vault →
              </Link>
            </motion.div>
          )}

          {(competition.status === "DONE" || competition.status === "FAILED") && (
            <button
              onClick={() => { setCompetition(null); setPrompt(""); setError(""); }}
              className="w-full rounded-xl border border-dashed border-white/10 py-3 text-sm text-gray-500 hover:border-brand-500/30 hover:text-brand-400 transition-colors"
            >
              Run another competition
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const EXAMPLE_PROMPTS: Record<Category, string> = {
  NEWS:       "What are the biggest geopolitical risks in 2025 that investors are underestimating?",
  FINANCE:    "Build an investment thesis for AI infrastructure stocks over the next 18 months",
  RESEARCH:   "What does the latest research say about the most effective B2B SaaS growth strategies?",
  CODING:     "Design a scalable microservices architecture for a fintech platform handling 1M transactions/day",
  MARKETING:  "Create a go-to-market strategy for a B2B AI productivity tool targeting SMEs",
  SALES:      "Design an outbound sales sequence to sell enterprise SaaS to Fortune 500 procurement teams",
  STRATEGY:   "What is the optimal pricing strategy for a new AI SaaS product entering a crowded market?",
  OPERATIONS: "Design an operations system to scale a 10-person team to 100 without losing quality",
};
