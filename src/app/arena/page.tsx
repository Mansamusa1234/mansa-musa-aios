"use client";

import { useState } from "react";

type Verdict = {
  winner: string;
  chatgptScore: number;
  grokScore: number;
  reason: string;
  bestAnswer: string;
};

type ArenaResponse = {
  chatgpt: string;
  grok: string;
  verdict: Verdict | null;
  models?: { chatgpt?: string; grok?: string; judge?: string };
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
      if (!res.ok) throw new Error(data.error || "Arena failed");
      setResult(data);
    } catch (error) {
      setResult({
        chatgpt: "",
        grok: "",
        verdict: null,
        error: error instanceof Error ? error.message : "Arena failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-sm font-semibold tracking-[0.2em] text-amber-400">MANSA MUSA AI</div>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">AI Model Arena</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            One task goes to ChatGPT and Grok at the same time. A separate judge scores both answers and produces a stronger merged result.
          </p>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl">
          <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-slate-200">Task</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Design the highest-converting digital product funnel for Fruits Crew, including product, landing page, pricing, email sequence and launch plan."
            className="min-h-40 w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
          />
          <button
            onClick={runArena}
            disabled={loading || !prompt.trim()}
            className="mt-4 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Models competing…" : "Run ChatGPT vs Grok"}
          </button>
          {result?.error && <p className="mt-4 text-red-300">{result.error}</p>}
        </section>

        {result && !result.error && (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <ModelCard title="ChatGPT" model={result.models?.chatgpt} content={result.chatgpt} />
              <ModelCard title="Grok" model={result.models?.grok} content={result.grok} />
            </div>

            {result.verdict && (
              <section className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold">Judge verdict: {result.verdict.winner}</h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm">ChatGPT {result.verdict.chatgptScore}/100</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm">Grok {result.verdict.grokScore}/100</span>
                </div>
                <p className="mt-3 text-slate-300">{result.verdict.reason}</p>
                <h3 className="mt-6 text-xl font-bold text-amber-300">Best merged answer</h3>
                <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-950/70 p-5 leading-7 text-slate-100">{result.verdict.bestAnswer}</div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ModelCard({ title, model, content }: { title: string; model?: string; content: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        {model && <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{model}</span>}
      </div>
      <div className="whitespace-pre-wrap leading-7 text-slate-200">{content}</div>
    </section>
  );
}
