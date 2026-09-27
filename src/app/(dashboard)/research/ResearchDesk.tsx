"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Summary = { id: string; title: string; description: string | null; updatedAt: string; _count: { claims: number; sources: number } };
type Source = { id: string; title: string; url: string; publisher: string | null; sourceType: string; publishedAt: string | null; accessedAt: string; excerpt: string | null; notes: string | null };
type LinkRecord = { sourceId: string; stance: string; rationale: string | null };
type Review = { id: string; status: string; assessment: string; reviewedAt: string };
type Claim = { id: string; statement: string; status: string; assessment: string | null; reviewedAt: string | null; sources: LinkRecord[]; reviews: Review[] };
type Investigation = { id: string; title: string; description: string | null; claims: Claim[]; sources: Source[] };

const STATUSES = ["CONFIRMED", "DOCUMENTED_ALLEGATION", "CIRCUMSTANTIAL", "UNRESOLVED", "CONTRADICTED"] as const;
const labels: Record<string, string> = {
  UNASSESSED: "Not reviewed", CONFIRMED: "Confirmed by reviewed evidence", DOCUMENTED_ALLEGATION: "Documented allegation",
  CIRCUMSTANTIAL: "Circumstantial", UNRESOLVED: "Unresolved", CONTRADICTED: "Contradicted by reviewed evidence",
};
const field = "w-full rounded-xl border border-white/10 bg-[#151826] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-brand-400";
const button = "rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50";

async function request(url: string, body?: object) {
  const response = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request failed.");
  return result;
}

export default function ResearchDesk({ isAdmin }: { isAdmin: boolean }) {
  const [cases, setCases] = useState<Summary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<Investigation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [claim, setClaim] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState("PRIMARY");
  const [publisher, setPublisher] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [notes, setNotes] = useState("");

  const refreshCases = useCallback(async () => {
    const data = await request("/api/investigations");
    setCases(data.investigations);
  }, []);
  const loadCase = useCallback(async (id: string) => {
    const data = await request(`/api/investigations/${encodeURIComponent(id)}`);
    setActive(data.investigation);
  }, []);

  useEffect(() => { refreshCases().catch((e) => setError(e.message)); }, [refreshCases]);
  useEffect(() => {
    if (activeId) loadCase(activeId).catch((e) => setError(e.message));
    else setActive(null);
  }, [activeId, loadCase]);

  async function mutate(url: string, payload: object, after?: () => void) {
    setBusy(true);
    setError("");
    try {
      const data = await request(url, payload);
      after?.();
      await refreshCases();
      if (activeId) await loadCase(activeId);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      return null;
    } finally { setBusy(false); }
  }

  async function createCase(e: FormEvent) {
    e.preventDefault();
    const result = await mutate("/api/investigations", { title, description }, () => { setTitle(""); setDescription(""); });
    if (result) setActiveId(result.investigation.id);
  }

  const caseUrl = activeId ? `/api/investigations/${encodeURIComponent(activeId)}` : "";

  return (
    <div className="space-y-6 pb-12">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">· Intelligence · Research Desk ·</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Follow the evidence</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
          Keep claims, original records, opposing evidence and your reasoning together. Statuses reflect a human review of linked sources; adding a link alone does not verify its contents.
        </p>
      </header>
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <form onSubmit={createCase} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-bold text-white">New investigation</h2>
            <input aria-label="Investigation title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Birth registration claims" required minLength={3} maxLength={160} />
            <textarea aria-label="Investigation scope" className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Question, jurisdiction, scope" rows={3} maxLength={4000} />
            <button className={button} disabled={busy}>Create investigation</button>
          </form>
          {isAdmin && <button onClick={async () => { const result = await mutate("/api/investigations/starter", {}); if (result) setActiveId(result.investigation.id); }} disabled={busy} className="w-full rounded-xl border border-brand-500/40 bg-brand-500/10 p-3 text-left text-sm font-semibold text-brand-200 hover:bg-brand-500/20 disabled:opacity-50">
            Open the research starter →
            <span className="mt-1 block text-xs font-normal text-gray-400">Nine claims from your discussion, with original source links and no preset verdicts.</span>
          </button>}
          <nav aria-label="Investigations" className="space-y-2">
            {cases.length === 0 && <p className="text-sm text-gray-500">No investigations saved yet.</p>}
            {cases.map((item) => (
              <button key={item.id} onClick={() => { setError(""); setActive(null); setActiveId(item.id); }} className={`w-full rounded-xl border p-3 text-left ${activeId === item.id ? "border-brand-500/60 bg-brand-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                <span className="block text-sm font-semibold text-white">{item.title}</span>
                <span className="mt-1 block text-xs text-gray-400">{item._count.claims} claims · {item._count.sources} sources</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-5">
          {!activeId && <div className="rounded-2xl border border-dashed border-white/15 p-8 text-sm text-gray-400">Create or select an investigation to start tracing claims.</div>}
          {activeId && !active && <div className="text-sm text-gray-400">Loading investigation…</div>}
          {active && <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-bold text-white">{active.title}</h2>
              {active.description && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-400">{active.description}</p>}
              <Link href="/evidence" className="mt-3 inline-block text-sm text-brand-300 hover:underline">Open uploaded documents in Evidence Vault →</Link>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <form onSubmit={(e) => { e.preventDefault(); void mutate(caseUrl, { action: "claim", statement: claim }, () => setClaim("")); }} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-bold text-white">Record a claim</h3>
                <textarea aria-label="Claim statement" className={field} rows={3} value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="Write one precise, testable claim" required minLength={8} maxLength={4000} />
                <button className={button} disabled={busy}>Add claim</button>
              </form>
              <form onSubmit={(e) => { e.preventDefault(); void mutate(caseUrl, { action: "source", title: sourceTitle, url: sourceUrl, sourceType, publisher, publishedAt, excerpt, notes }, () => { setSourceTitle(""); setSourceUrl(""); setPublisher(""); setPublishedAt(""); setExcerpt(""); setNotes(""); }); }} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-bold text-white">Register a source</h3>
                <input aria-label="Source title" className={field} value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="Document or page title" required minLength={3} maxLength={240} />
                <input aria-label="Source URL" className={field} type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" required />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select aria-label="Source type" className={field} value={sourceType} onChange={(e) => setSourceType(e.target.value)}><option value="PRIMARY">Primary record</option><option value="SECONDARY">Reporting / analysis</option><option value="OTHER">Other</option></select>
                  <input aria-label="Publisher" className={field} value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Author / publisher" maxLength={160} />
                </div>
                <label className="block text-xs text-gray-400">Publication date, if known<input className={`${field} mt-1`} type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} /></label>
                <textarea aria-label="Relevant passage" className={field} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Relevant passage or location in document" maxLength={6000} />
                <textarea aria-label="Source notes" className={field} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Provenance, limits, missing pages" maxLength={4000} />
                <button className={button} disabled={busy}>Add source</button>
              </form>
            </div>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white">Claims <span className="text-sm font-normal text-gray-500">({active.claims.length})</span></h3>
              {active.claims.length === 0 && <p className="text-sm text-gray-500">Record a precise claim, then attach sources that support, challenge or contextualise it.</p>}
              {active.claims.map((item) => <ClaimCard key={item.id} claim={item} sources={active.sources} busy={busy} save={(payload) => mutate(caseUrl, payload)} />)}
            </section>
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white">Source register <span className="text-sm font-normal text-gray-500">({active.sources.length})</span></h3>
              {active.sources.map((source) => <article key={source.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-brand-300 hover:underline">{source.title} ↗</a>
                <p className="mt-1 text-xs text-gray-400">{source.sourceType.toLowerCase()} · {source.publisher || "Publisher unknown"}{source.publishedAt ? ` · Published ${source.publishedAt.slice(0, 10)}` : ""} · Logged {source.accessedAt.slice(0, 10)}</p>
                {source.excerpt && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{source.excerpt}</p>}
                {source.notes && <p className="mt-2 whitespace-pre-wrap text-xs text-gray-400">Notes: {source.notes}</p>}
              </article>)}
            </section>
          </>}
        </main>
      </div>
    </div>
  );
}

function ClaimCard({ claim, sources, busy, save }: { claim: Claim; sources: Source[]; busy: boolean; save: (payload: object) => Promise<unknown> }) {
  const [sourceId, setSourceId] = useState("");
  const [stance, setStance] = useState("SUPPORTS");
  const [rationale, setRationale] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("UNRESOLVED");
  const [assessment, setAssessment] = useState("");
  return <article className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
    <div className="flex flex-wrap items-start justify-between gap-2"><p className="max-w-2xl whitespace-pre-wrap text-sm font-semibold text-white">{claim.statement}</p><span className="rounded-full border border-brand-400/30 px-3 py-1 text-xs text-brand-200">{labels[claim.status] || claim.status}</span></div>
    {claim.assessment && <p className="whitespace-pre-wrap border-l-2 border-brand-500 pl-3 text-sm text-gray-300">{claim.assessment}</p>}
    <div className="space-y-1">{claim.sources.map((linked) => {
      const source = sources.find((entry) => entry.id === linked.sourceId);
      return source && <p key={linked.sourceId} className="text-xs text-gray-300"><span className="font-semibold text-gray-400">{linked.stance.toLowerCase()}:</span> <a className="text-brand-300 hover:underline" href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a>{linked.rationale ? ` — ${linked.rationale}` : ""}</p>;
    })}</div>
    {sources.length > 0 && <form onSubmit={async (e) => { e.preventDefault(); if (await save({ action: "link", claimId: claim.id, sourceId, stance, rationale })) setRationale(""); }} className="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[1fr_140px]">
      <select aria-label="Source to link" className={field} value={sourceId} onChange={(e) => setSourceId(e.target.value)} required><option value="">Select source…</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}</select>
      <select aria-label="Evidence relationship" className={field} value={stance} onChange={(e) => setStance(e.target.value)}><option value="SUPPORTS">Supports</option><option value="CHALLENGES">Challenges</option><option value="CONTEXT">Context</option></select>
      <input aria-label="Why this source is relevant" className={field} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Which passage matters, and why?" maxLength={2000} />
      <button className={button} disabled={busy}>Link source</button>
    </form>}
    <form onSubmit={async (e) => { e.preventDefault(); if (await save({ action: "review", claimId: claim.id, status, assessment })) setAssessment(""); }} className="space-y-2 border-t border-white/10 pt-4">
      <label className="block text-xs font-semibold text-gray-400">Human review</label>
      <select aria-label="Assessment status" className={field} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>{STATUSES.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select>
      <textarea aria-label="Reasoned assessment" className={field} rows={2} value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="Explain what the linked material establishes, and what remains uncertain" minLength={12} maxLength={6000} required />
      <button className={button} disabled={busy}>Save review</button>
      <p className="text-xs text-gray-500">Confirmed requires a linked primary source; contradicted requires a linked challenging source. Source classifications and reviews are entered by you.</p>
    </form>
    {claim.reviews.length > 0 && <details className="text-xs text-gray-400"><summary className="cursor-pointer">Review history ({claim.reviews.length} recent)</summary><ol className="mt-2 space-y-2">{claim.reviews.map((review) => <li key={review.id}><span className="text-gray-300">{new Date(review.reviewedAt).toLocaleString()} · {labels[review.status]}</span><p className="whitespace-pre-wrap">{review.assessment}</p></li>)}</ol></details>}
  </article>;
}
