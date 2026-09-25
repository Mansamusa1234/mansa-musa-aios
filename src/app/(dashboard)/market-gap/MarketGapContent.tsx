"use client";

import { FormEvent, useState } from "react";

type Result = {
  report: string;
  source: string;
  liveSearch: boolean;
  runId?: string | null;
  warning?: string;
};

const FRUITS_CREW = {
  projectName: "Fruits Crew",
  idea: "A character-led children's educational universe where fruits, vegetables, seeds, plants, soil, water and the natural world teach literacy, maths, science, languages, technology, money, history, culture and practical life skills through stories, songs, animation, games and activities.",
  customers: "Parents, carers, grandparents, nurseries, primary schools, homeschool families and educational organisations; children are the end users.",
  problem: "Parents want engaging screen experiences that teach useful skills, but many children's platforms separate nature, practical knowledge and wider life learning from core literacy and maths.",
  market: "United Kingdom first, then global English-speaking and multilingual markets",
  goal: "Find the strongest evidence-backed niche, the competitors with the greatest reach, the content themes winning on YouTube/social, and the smallest paid MVP worth testing.",
  keywords: "kids learning app, preschool education, nature learning for children, educational cartoons, kids science, phonics, maths for kids, financial literacy children",
};

export default function MarketGapContent() {
  const [form, setForm] = useState(FRUITS_CREW);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  function setField(field: keyof typeof FRUITS_CREW, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/market-gap/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          context,
          keywords: form.keywords.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Research failed");
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Research failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-400">· Supercomputer Research ·</p>
          <h1 className="text-2xl font-extrabold text-white">Market Gap Intelligence</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-400">
            Validate a project before building: buyers, competitors, scale evidence, YouTube/social visibility,
            customer complaints, market gaps, positioning and the smallest MVP to test.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
          First preset: <span className="font-semibold text-white">Fruits Crew</span>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-5">
          <Field label="Project name" value={form.projectName} onChange={(v) => setField("projectName", v)} />
          <TextArea label="Business / project idea" value={form.idea} onChange={(v) => setField("idea", v)} rows={5} />
          <TextArea label="Who are the customers?" value={form.customers} onChange={(v) => setField("customers", v)} rows={3} />
          <TextArea label="What problem does it solve?" value={form.problem} onChange={(v) => setField("problem", v)} rows={3} />
          <Field label="Target market" value={form.market} onChange={(v) => setField("market", v)} />
          <TextArea label="Research goal" value={form.goal} onChange={(v) => setField("goal", v)} rows={3} />
          <TextArea
            label="Extra project context (optional)"
            value={context}
            onChange={setContext}
            rows={4}
            placeholder="Existing product, pricing, audience, constraints, links or known competitors."
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">Search themes</label>
            <textarea
              value={form.keywords}
              onChange={(event) => setField("keywords", event.target.value)}
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-500/60"
            />
            <p className="mt-2 text-[11px] text-gray-500">Comma-separated. The research worker can derive additional searches.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Researching the market…" : "Analyze Market Gap"}
          </button>

          <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-xs leading-5 text-gray-400">
            <p className="font-semibold text-gray-200">Evidence standard</p>
            <p className="mt-1">
              Revenue, market leadership and social performance are only treated as facts when a source supports them.
              Funding, traffic, followers and views are labelled as proxies rather than sales.
            </p>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {result && (
        <section className="space-y-3 rounded-2xl border border-white/8 bg-[#0c0c18] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-lg font-bold text-white">Research Report</h2>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              result.liveSearch ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"
            }`}>
              {result.liveSearch ? "LIVE WEB RESEARCH" : "OFFLINE FALLBACK"}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-400">{result.source}</span>
          </div>

          {result.warning && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {result.warning}
            </div>
          )}

          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-gray-200">{result.report}</pre>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-500/60"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-500/60"
      />
    </label>
  );
}
