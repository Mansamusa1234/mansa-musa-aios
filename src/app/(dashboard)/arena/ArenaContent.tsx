"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

const DEBATER_ICONS: Record<string, string> = {
  research: "🔎",
  "legal-dictionary": "📖",
  "common-law": "⚖️",
  statute: "📜",
  evidence: "🧾",
  risk: "⚠️",
  "plain-english": "💬",
  commercial: "💼",
};

const STAGES = ["RUNNING", "DEBATING", "CRITIQUING", "IMPROVING", "SCORING", "SYNTHESIZING", "DONE"];
const STAGE_LABELS: Record<string, string> = {
  RUNNING: "Starting",
  DEBATING: "Initial answers",
  CRITIQUING: "Critiquing each other",
  IMPROVING: "Improving answers",
  SCORING: "Wisdom Judge scoring",
  SYNTHESIZING: "Synthesising",
  DONE: "Complete",
};

interface AgentResponse {
  agentKey: string;
  agentName: string;
  agentRole: string;
  round: "INITIAL" | "CRITIQUE" | "IMPROVED";
  content: string;
  createdAt: string;
}

interface AgentScore {
  agentKey: string;
  agentName: string;
  truth: number; evidence: number; depth: number; practicality: number;
  riskAwareness: number; originality: number; clarity: number; longTermValue: number;
  total: number; rationale: string;
}

interface SessionData {
  id: string;
  question: string;
  status: string;
  error: string | null;
  responses: AgentResponse[];
  scores: AgentScore[];
  synthesis: string | null;
  savedToVault: boolean;
}

interface Props {
  canUseArena: boolean;
  canExportLetters: boolean;
  plan: string;
  initialSessionId?: string;
}

function extractSourceNotes(session: SessionData): string[] {
  const notes = new Set<string>();
  const sourcePattern = /(source|fact[- ]?check|check|verify|evidence|document|statute|regulation|contract|court|record|filing|guidance)/i;

  [...session.responses.map((r) => r.content), session.synthesis ?? ""]
    .flatMap((content) => content.split(/\n+/))
    .map((line) => line.replace(/^[-*#\d.)\s]+/, "").trim())
    .filter((line) => line.length > 18 && sourcePattern.test(line))
    .slice(0, 12)
    .forEach((line) => notes.add(line));

  if (notes.size === 0) {
    notes.add("No live sources were fetched in this run. Check primary legislation, official guidance, contracts, dated correspondence, and supporting documents before acting.");
  }

  return [...notes].slice(0, 8);
}

function buildLetterPack(session: SessionData): string {
  return [
    "MansaMusaAI Agent Arena Letter Pack",
    "",
    `Question: ${session.question}`,
    "",
    "Draft letter / workflow starting point",
    "--------------------------------------",
    session.synthesis ?? "No best answer available yet.",
    "",
    "Evidence checklist",
    "------------------",
    ...extractSourceNotes(session).map((note) => `- ${note}`),
    "",
    "Disclaimer: This export is informational support, not advice from a solicitor. Ask a qualified solicitor or regulated adviser before acting on legal rights or deadlines.",
  ].join("\n");
}

function ProgressBar({ status }: { status: string }) {
  const idx = STAGES.indexOf(status);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-center justify-between">
        {STAGES.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                i < idx ? "bg-green-400" : i === idx ? "bg-brand-400" : "bg-white/10"
              }`}
            />
            {i === idx && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-center text-[10px] font-semibold text-brand-300"
              >
                {STAGE_LABELS[s]}
              </motion.p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/6">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-300"
          animate={{ width: `${((idx + 1) / STAGES.length) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function AgentGrid({ responses, status }: { responses: AgentResponse[]; status: string }) {
  const keys = Object.keys(DEBATER_ICONS);
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {keys.map((key) => {
        const rounds = responses.filter((r) => r.agentKey === key).map((r) => r.round);
        const name = responses.find((r) => r.agentKey === key)?.agentName ?? key;
        const stage = rounds.includes("IMPROVED") ? "Final" : rounds.includes("CRITIQUE") ? "Critiquing" : rounds.includes("INITIAL") ? "Answered" : "Thinking…";
        const isThinking = stage === "Thinking…" && status !== "DONE" && status !== "FAILED";
        return (
          <motion.div key={key} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-3 text-center">
            <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-lg">
              {DEBATER_ICONS[key]}
            </div>
            <p className="truncate text-[11px] font-bold text-white">{name}</p>
            <p className={`mt-0.5 text-[10px] font-medium ${isThinking ? "text-gray-500" : "text-brand-400"}`}>
              {isThinking ? (
                <span className="inline-flex items-center gap-1">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>●</motion.span>
                  {stage}
                </span>
              ) : stage}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function DebateTimeline({ responses }: { responses: AgentResponse[] }) {
  const roundLabel: Record<string, string> = { INITIAL: "Initial answer", CRITIQUE: "Critique", IMPROVED: "Final answer" };
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {responses.map((r, i) => (
          <motion.div
            key={`${r.agentKey}-${r.round}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="rounded-xl border border-white/8 bg-white/3 p-4"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-base">{DEBATER_ICONS[r.agentKey]}</span>
              <span className="text-xs font-bold text-white">{r.agentName}</span>
              <span className="rounded-full bg-white/6 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500">
                {roundLabel[r.round]}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-400">{r.content}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ScoreBoard({ scores }: { scores: AgentScore[] }) {
  const sorted = [...scores].sort((a, b) => b.total - a.total);
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold text-white">Agent Scores</h2>
      <div className="space-y-2">
        {sorted.map((s, i) => {
          const pct = Math.round((s.total / 80) * 100);
          const isWinner = i === 0;
          return (
            <motion.div
              key={s.agentKey}
              initial={{ opacity: 0, scale: isWinner ? 0.9 : 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
              className={`rounded-xl border p-4 ${
                isWinner ? "border-amber-400/40 bg-amber-500/10 shadow-[0_0_24px_-4px_rgba(251,191,36,0.5)]" : "border-white/8 bg-white/3"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{DEBATER_ICONS[s.agentKey]}</span>
                  <span className="truncate text-xs font-bold text-white">{s.agentName}</span>
                  {isWinner && (
                    <motion.span
                      initial={{ opacity: 0, rotate: -10 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300"
                    >
                      🏆 WINNER
                    </motion.span>
                  )}
                </div>
                <p className={`flex-shrink-0 text-sm font-extrabold ${isWinner ? "text-amber-300" : "text-brand-400"}`}>
                  <CountUp value={pct} suffix="%" />
                </p>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${isWinner ? "bg-gradient-to-r from-amber-400 to-amber-300" : "bg-brand-500"}`}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-gray-500 sm:grid-cols-4">
                <span>Accuracy {s.truth}/10</span>
                <span>Usefulness {s.practicality}/10</span>
                <span>Risk {s.riskAwareness}/10</span>
                <span>Clarity {s.clarity}/10</span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">{s.rationale}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface LeaderboardEntry {
  agentId: string;
  name: string;
  key: string;
  wins: number;
  sessions: number;
  avgScore: number;
  lastSeen: string | null;
}

export default function ArenaContent({ canUseArena, canExportLetters, plan, initialSessionId }: Props) {
  const [question, setQuestion] = useState("");
  const [session, setSession] = useState<SessionData | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"debate" | "leaderboard">("debate");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadLeaderboard() {
    if (leaderboard) return;
    setLbLoading(true);
    try {
      const res = await fetch("/api/arena/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } finally {
      setLbLoading(false);
    }
  }

  function switchTab(t: "debate" | "leaderboard") {
    setTab(t);
    if (t === "leaderboard") loadLeaderboard();
  }

  const poll = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/arena/${sessionId}`);
    if (!res.ok) return;
    const data: SessionData = await res.json();
    setSession(data);
    if (data.status === "DONE" || data.status === "FAILED") {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (initialSessionId) poll(initialSessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  useEffect(() => {
    if (!session || session.status === "DONE" || session.status === "FAILED") return;
    intervalRef.current = setInterval(() => poll(session.id), 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  async function startArena() {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/arena/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSession({ id: data.sessionId, question, status: "RUNNING", error: null, responses: [], scores: [], synthesis: null, savedToVault: false });
    } finally {
      setStarting(false);
    }
  }

  async function saveToVault() {
    if (!session) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/arena/${session.id}/save`, { method: "POST" });
      if (res.ok) setSession((prev) => (prev ? { ...prev, savedToVault: true } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function exportAsLetter() {
    if (!session?.synthesis || !canExportLetters) return;
    const res = await fetch("/api/export/letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Agent Arena Letter Pack - ${session.id}`,
        question: session.question,
        answer: session.synthesis,
        sources: extractSourceNotes(session),
      }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mansa-agent-arena-letter-${session.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function askAnother() {
    setSession(null);
    setQuestion("");
    setError("");
  }

  if (!canUseArena) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">⚔️</div>
        <h1 className="text-2xl font-extrabold text-white">Agent Arena</h1>
        <p className="mt-2 text-sm text-gray-500">
          Eight specialist agents compete, score each other, and select the strongest answer with sources, risk notes, and plain-English next steps.
        </p>
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/3 p-6">
          <p className="text-sm text-gray-300">
            Agent Arena requires a <span className="font-bold text-brand-300">Professional</span> or{" "}
            <span className="font-bold text-brand-300">Enterprise</span> plan. You're currently on{" "}
            <span className="font-semibold capitalize">{plan}</span>.
          </p>
          <Link
            href="/billing"
            className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Upgrade to Professional
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Agent Arena ·</p>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Eight agents compete. One best answer.</h1>
            <p className="mt-1 text-sm text-gray-500">Research, legal dictionary, common law, statute, evidence, risk, plain-English, and commercial agents challenge each other before the final answer is selected.</p>
          </div>
          <Link href="/arena/vault" className="flex-shrink-0 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/8 transition-colors">
            📚 My Vault
          </Link>
        </motion.div>

        {/* Tab toggle */}
        <motion.div variants={fadeUp} className="mt-4 flex gap-2">
          {(["debate", "leaderboard"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                tab === t ? "bg-brand-500 text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"
              }`}
            >
              {t === "debate" ? "⚔️ Competition" : "🏆 Leaderboard"}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {tab === "leaderboard" ? (
        <div>
          <h2 className="mb-3 text-sm font-bold text-white">Lifetime Agent Leaderboard</h2>
          {lbLoading && <p className="text-xs text-gray-500">Loading leaderboard…</p>}
          {!lbLoading && leaderboard?.length === 0 && (
            <p className="text-xs text-gray-500">No completed debates yet. Start the first one!</p>
          )}
          {leaderboard && leaderboard.length > 0 && (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.agentId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 rounded-xl border p-4 ${
                    i === 0 ? "border-amber-400/40 bg-amber-500/10" : "border-white/8 bg-white/3"
                  }`}
                >
                  <span className="w-6 text-center text-sm font-extrabold text-gray-400">#{i + 1}</span>
                  <span className="text-xl">{DEBATER_ICONS[entry.key] ?? "🤖"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {entry.name}
                      {i === 0 && <span className="ml-2 text-amber-300">🏆</span>}
                    </p>
                    <p className="text-[11px] text-gray-500">{entry.sessions} debate{entry.sessions !== 1 ? "s" : ""} · avg {entry.avgScore}/80</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-extrabold ${i === 0 ? "text-amber-300" : "text-brand-400"}`}>{entry.wins}</p>
                    <p className="text-[10px] text-gray-400">win{entry.wins !== 1 ? "s" : ""}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : !session ? (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-white/8 bg-white/3 p-5">
          {error && <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Ask one question — e.g. 'What evidence do I need before sending a breach-of-contract letter?'"
            className="w-full resize-none rounded-xl border border-white/8 bg-white/4 p-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-500/40"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">{question.length}/1000 — Professional+ Agent Arena. Informational support, not a solicitor.</p>
            <button
              onClick={startArena}
              disabled={starting || question.trim().length < 8}
              className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {starting ? "Starting…" : "Start Agent Competition"}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Agent Competition Results</p>
            <p className="mt-1 text-sm text-gray-200">{session.question}</p>
          </div>

          {session.status !== "FAILED" && <ProgressBar status={session.status} />}

          {session.status === "FAILED" && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              Something went wrong running this debate. {session.error}
            </div>
          )}

          <AgentGrid responses={session.responses} status={session.status} />

          {session.responses.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold text-white">Agent Competition Results</h2>
              <DebateTimeline responses={session.responses} />
            </div>
          )}

          {session.scores.length > 0 && <ScoreBoard scores={session.scores} />}

          {session.synthesis && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="text-lg">✨</span> Best Answer
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportAsLetter}
                    disabled={!canExportLetters}
                    className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/8 disabled:opacity-50 transition-colors"
                    title={canExportLetters ? "Export as a plain-text letter pack" : "Export Letter Pack requires Starter or higher"}
                  >
                    Export as Letter
                  </button>
                  <button
                    onClick={saveToVault}
                    disabled={saving || session.savedToVault}
                    className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/8 disabled:opacity-60 transition-colors"
                  >
                    {session.savedToVault ? "✓ Saved to Wisdom Vault" : saving ? "Saving…" : "Save to Wisdom Vault"}
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{session.synthesis}</p>
            </motion.div>
          )}

          {session.synthesis && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <h2 className="mb-3 text-sm font-bold text-white">Sources Checked</h2>
              <ul className="space-y-2 text-xs leading-relaxed text-gray-400">
                {extractSourceNotes(session).map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="text-brand-400">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-amber-300/90">
                Dictionary definitions are used for definitions only and are not legal authority by themselves.
              </p>
            </div>
          )}

          {(session.status === "DONE" || session.status === "FAILED") && (
            <button
              onClick={askAnother}
              className="w-full rounded-xl border border-dashed border-white/10 py-3 text-sm text-gray-500 hover:border-brand-500/30 hover:text-brand-400 transition-colors"
            >
              Ask another question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
