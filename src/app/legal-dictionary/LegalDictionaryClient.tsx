"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DictionaryModule, LegalDictionaryEntry } from "@/lib/legalDictionary";

interface Props {
  modules: DictionaryModule[];
  initialResults: LegalDictionaryEntry[];
  licensedPlaceholders: LegalDictionaryEntry[];
}

interface UploadedSource {
  name: string;
  type: string;
  text: string;
  note: string;
}

export default function LegalDictionaryClient({ modules, initialResults, licensedPlaceholders }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LegalDictionaryEntry[]>(initialResults);
  const [searching, setSearching] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedSource[]>([]);
  const [uploadError, setUploadError] = useState("");

  const uploadedMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return uploaded
      .map((source) => {
        const idx = source.text.toLowerCase().indexOf(q);
        if (idx === -1) return null;
        return {
          name: source.name,
          excerpt: source.text.slice(Math.max(0, idx - 120), idx + q.length + 180),
        };
      })
      .filter(Boolean) as { name: string; excerpt: string }[];
  }, [query, uploaded]);

  async function runSearch(nextQuery = query) {
    setSearching(true);
    try {
      const res = await fetch(`/api/legal-dictionary/search?q=${encodeURIComponent(nextQuery)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function handleUpload(fileList: FileList | null) {
    setUploadError("");
    if (!fileList) return;

    const next: UploadedSource[] = [];
    for (const file of Array.from(fileList)) {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        next.push({
          name: file.name,
          type: "PDF",
          text: "",
          note: "PDF accepted as lawful-source metadata. Text extraction/indexing can be added when a licensed parser/storage workflow is configured.",
        });
        continue;
      }

      if (!file.type.startsWith("text/") && !/\.(txt|md|csv)$/i.test(file.name)) {
        setUploadError(`${file.name} was skipped. Upload .txt, .md, .csv, or PDF files only.`);
        continue;
      }

      const text = await file.text();
      next.push({
        name: file.name,
        type: "Text",
        text,
        note: "Indexed locally in this browser session only. Upload only public-domain or licensed/user-provided material.",
      });
    }

    setUploaded((prev) => [...prev, ...next]);
  }

  return (
    <div className="min-h-screen bg-[#070712] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-xs font-semibold text-brand-300 hover:text-brand-200">← Dashboard</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Legal Dictionary Knowledge Library</p>
            <h1 className="mt-2 text-4xl font-extrabold">Search lawful legal terminology sources</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              Public-domain and MansaMusaAI glossary entries include citations/source labels. Copyrighted dictionaries are locked until
              you provide licensed text. Definitions explain terminology only; they are not legal authority.
            </p>

            <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                  placeholder="Search contract, affidavit, statute, evidence..."
                  className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-500/50"
                />
                <button
                  type="button"
                  onClick={() => runSearch()}
                  disabled={searching}
                  className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {results.length === 0 && <p className="text-sm text-gray-500">Search to see dictionary results.</p>}
              {results.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-white/8 bg-white/4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold">{entry.term}</h2>
                    <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-300">
                      {entry.sourceType}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">{entry.definition}</p>
                  <p className="mt-3 text-xs text-gray-500">Source: {entry.citation}</p>
                </article>
              ))}
            </div>

            {uploadedMatches.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-bold">Uploaded source matches</h2>
                <div className="space-y-3">
                  {uploadedMatches.map((match) => (
                    <div key={`${match.name}-${match.excerpt}`} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-xs font-bold text-amber-300">{match.name}</p>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-300">{match.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
              <h2 className="text-sm font-bold">Upload lawful sources</h2>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                Upload only public-domain text or material you are licensed to use. Text files are indexed locally in your browser session.
                PDFs are accepted as future-source metadata; no copyrighted text is scraped or bundled.
              </p>
              <input
                type="file"
                multiple
                accept=".txt,.md,.csv,.pdf,text/plain,text/markdown,text/csv,application/pdf"
                onChange={(e) => handleUpload(e.target.files)}
                className="mt-4 block w-full text-xs text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
              />
              {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
              {uploaded.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {uploaded.map((source) => (
                    <li key={source.name} className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <p className="text-xs font-bold">{source.name}</p>
                      <p className="mt-1 text-[11px] text-gray-500">{source.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
              <h2 className="text-sm font-bold">Library modules</h2>
              <div className="mt-3 space-y-2">
                {modules.map((module) => (
                  <div key={module.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold">{module.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${module.status === "available" ? "bg-green-500/15 text-green-300" : "bg-amber-500/15 text-amber-300"}`}>
                        {module.status === "available" ? "Available" : "Licensed upload"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">{module.notice}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h2 className="text-sm font-bold text-amber-200">Licensed-only dictionaries</h2>
              <ul className="mt-3 space-y-2 text-xs text-amber-100/80">
                {licensedPlaceholders.map((entry) => (
                  <li key={entry.id}>• {entry.term}: {entry.citation}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
