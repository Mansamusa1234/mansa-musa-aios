"use client";

import Link from "next/link";
import { useState } from "react";

const AGENTS = [
  { icon: "🧭", name: "Marketing Director", role: "Campaign strategy, audience, offer and priorities." },
  { icon: "🔎", name: "Research Agent", role: "Market signals, customer pain points and content opportunities." },
  { icon: "✍️", name: "Copy Agent", role: "Hooks, captions, scripts, calls-to-action and brand voice." },
  { icon: "🎬", name: "Creative Agent", role: "Video, image, ad and thumbnail creative briefs." },
  { icon: "✂️", name: "Repurposing Agent", role: "Turns one idea into platform-specific short-form versions." },
  { icon: "🚀", name: "Publishing Agent", role: "Moves approved content into connected publishing workflows." },
  { icon: "📊", name: "Analytics Agent", role: "Feeds results back into the next campaign cycle." },
  { icon: "🛡️", name: "Approval Gate", role: "Nothing publishes until you approve it in Command Centre." },
];

export default function MarketingTeamClient({
  pendingCount,
  abacusConfigured,
}: {
  pendingCount: number;
  abacusConfigured: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [queued, setQueued] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState("");

  async function runMarketing() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/marketing-team/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign: "daily", brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to run the marketing team.");
      setQueued(data.queued);
      setTitle(data.title);
      setSource(data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run the marketing team.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-500/15 via-[#101027] to-[#080812] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-300">Mansa Musa AI Marketing OS</p>
            <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Your AI marketing department</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
              One command prepares a complete content batch. Abacus can handle the heavy agent work, while Mansa Musa AI keeps control, approvals and publishing in one dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={runMarketing} disabled={running}
              className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60">
              {running ? "Agents working…" : "Run today’s marketing"}
            </button>
            <Link href="/command-centre"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-bold text-gray-200 transition hover:bg-white/10">
              Open approval queue
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">Optional campaign instruction</label>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3}
            placeholder="Example: Focus today on UK restaurants and salons. Push the free trial and make 3 short-form video angles."
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-brand-500/60" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs text-gray-500">Approval queue</p>
            <p className="mt-1 text-2xl font-bold text-white">{queued ?? pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs text-gray-500">Abacus SuperComputer</p>
            <p className={`mt-1 text-sm font-bold ${abacusConfigured ? "text-green-400" : "text-amber-300"}`}>
              {abacusConfigured ? "Worker connected" : "Ready for worker URL"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs text-gray-500">Publishing safety</p>
            <p className="mt-1 text-sm font-bold text-green-400">Human approval required</p>
          </div>
        </div>

        {(queued !== null || error) && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
            {error ? <p className="text-red-300">{error}</p> : (
              <p className="text-green-300">
                {queued} drafts queued for “{title}” using {source === "abacus-supercomputer" ? "Abacus SuperComputer" : "native fallback"}. Review them before publishing.
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Marketing team</h2>
          <p className="mt-1 text-sm text-gray-500">Specialised roles coordinated as one department.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {AGENTS.map((agent) => (
            <div key={agent.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <span className="text-2xl">{agent.icon}</span>
              <h3 className="mt-3 font-bold text-white">{agent.name}</h3>
              <p className="mt-2 text-sm leading-5 text-gray-500">{agent.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <h2 className="font-bold text-white">Workflow</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Brief → Abacus/native agent team → platform drafts → Command Centre approval → connected social APIs → analytics feedback.
        </p>
      </section>
    </div>
  );
}
