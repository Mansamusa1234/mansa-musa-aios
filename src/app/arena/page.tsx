"use client";

import { useState } from "react";

type Answer = {
  provider: string;
  model: string;
  family?: "frontier" | "open";
  content: string;
  ok: boolean;
  error?: string;
};

type Verdict = {
  winner: string;
  scores: Record<string, number>;
  reason: string;
  bestAnswer: string;
};

type ArenaResponse = {
  prompt?: string;
  answers?: Answer[];
  verdict: Verdict | null;
  contestantCount?: number;
  successfulCount?: number;
  error?: string;
};

export default function ArenaPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ArenaResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function runArena() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as ArenaResponse;
      if (!res.ok) throw new Error(data.error || "AI Clash failed");
      setResult(data);
    } catch (error) {
      setResult({ verdict: null, error: error instanceof Error ? error.message : "AI Clash failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-400">MANSA MUSA AI</div>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Clash of the AIs</h1>
          <p className="mt-3 max-w-4xl text-slate-300">
            One task. Multiple AI families. ChatGPT, Grok, Claude, Gemini, Mistral and configurable open models compete independently. The Arena scores the answers and builds one stronger Mansa Musa AI response from the best work.
          </p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {["ChatGPT", "Grok", "Claude", "Gemini", "Mistral", "Open Models"].map((name) => (
              <span key={name} className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-slate-300">{name}</span>
            ))}
          </div>
          <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-slate-200">Challenge</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Give every AI the exact same challenge..."
            className="min-h-40 w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={runArena}
              disabled={loading || !prompt.trim()}
              className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "The AIs are competing…" : "Start AI Clash"}
            </button>
            <span className="text-sm text-slate-400">Same prompt. Independent answers. Neutral scoring.</span>
          </div>
          {result?.error && (
            <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-red-200">
              {result.error === "Unauthorized" ? "Please sign in to enter the AI Clash Arena." : result.error}
            </p>
          )}
        </section>

        {result?.answers && !result.error && (
          <>
            <div className="mt-6 text-sm text-slate-400">
              {result.successfulCount ?? result.answers.filter((a) => a.ok).length} of {result.contestantCount ?? result.answers.length} contestants answered successfully.
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {result.answers.map((answer, index) => (
                <ModelCard key={`${answer.provider}-${answer.model}-${index}`} answer={answer} score={result.verdict?.scores?.[answer.provider]} />
              ))}
            </div>

            {result.verdict && (
              <section className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">Clash winner: {result.verdict.winner}</h2>
                  {Object.entries(result.verdict.scores || {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, score]) => (
                      <span key={name} className="rounded-full bg-white/10 px-3 py-1 text-sm">{name} {score}/100</span>
                    ))}
                </div>
                <p className="mt-3 text-slate-300">{result.verdict.reason}</p>
                <h3 className="mt-6 text-xl font-bold text-amber-300">Mansa Musa AI — Ultimate Combined Answer</h3>
                <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-950/70 p-5 leading-7 text-slate-100">
                  {result.verdict.bestAnswer}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ModelCard({ answer, score }: { answer: Answer; score?: number }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{answer.provider}</h2>
            {answer.family && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">{answer.family}</span>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-400">{answer.model}</div>
        </div>
        {typeof score === "number" && <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm text-amber-200">{score}/100</span>}
      </div>
      {answer.ok ? (
        <div className="whitespace-pre-wrap leading-7 text-slate-200">{answer.content}</div>
      ) : (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          Contestant unavailable. {answer.error || "Check the API key and model setting."}
        </div>
      )}
    </section>
  );
}
