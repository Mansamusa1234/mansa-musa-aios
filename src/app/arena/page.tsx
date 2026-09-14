"use client";

import { useState } from "react";

type Answer = {
  provider: string;
  model: string;
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
      if (!res.ok) throw new Error(data.error || "AI Council failed");
      setResult(data);
    } catch (error) {
      setResult({ verdict: null, error: error instanceof Error ? error.message : "AI Council failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-400">MANSA MUSA AI</div>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">AI Council</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Ask once. ChatGPT, Grok, Claude and Gemini answer independently. The council then scores the responses and produces one stronger merged answer.
          </p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl">
          <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-slate-200">Your task</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Build a complete launch and monetisation plan for my digital product, including funnel, pricing, content and implementation steps."
            className="min-h-40 w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={runArena}
              disabled={loading || !prompt.trim()}
              className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Council working…" : "Ask all 4 AIs"}
            </button>
            <span className="text-sm text-slate-400">ChatGPT + Grok + Claude + Gemini</span>
          </div>
          {result?.error && (
            <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-red-200">
              {result.error === "Unauthorized" ? "Please sign in to use the AI Council." : result.error}
            </p>
          )}
        </section>

        {result?.answers && !result.error && (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {result.answers.map((answer) => (
                <ModelCard key={answer.provider} answer={answer} score={result.verdict?.scores?.[answer.provider]} />
              ))}
            </div>

            {result.verdict && (
              <section className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">Council winner: {result.verdict.winner}</h2>
                  {Object.entries(result.verdict.scores || {}).map(([name, score]) => (
                    <span key={name} className="rounded-full bg-white/10 px-3 py-1 text-sm">{name} {score}/100</span>
                  ))}
                </div>
                <p className="mt-3 text-slate-300">{result.verdict.reason}</p>
                <h3 className="mt-6 text-xl font-bold text-amber-300">Mansa Musa AI — Best Combined Answer</h3>
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
          <h2 className="text-2xl font-bold">{answer.provider}</h2>
          <div className="mt-1 text-xs text-slate-400">{answer.model}</div>
        </div>
        {typeof score === "number" && <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm text-amber-200">{score}/100</span>}
      </div>
      {answer.ok ? (
        <div className="whitespace-pre-wrap leading-7 text-slate-200">{answer.content}</div>
      ) : (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          This provider is not available yet. {answer.error || "Check its API key and model setting."}
        </div>
      )}
    </section>
  );
}
