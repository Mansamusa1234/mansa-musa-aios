"use client";

import { useState, useMemo, useCallback } from "react";
import { CATEGORY_LABELS, CATEGORY_ICONS, type WisdomEntry, type WisdomCategory } from "@/lib/wisdomLibrary";

interface Props {
  entries: WisdomEntry[];
}

const ALL = "all" as const;

export default function WisdomLibraryClient({ entries }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<WisdomCategory | typeof ALL>(ALL);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [daily] = useState(() => entries[Math.floor(Math.random() * entries.length)]);

  const categories = useMemo(() => {
    const seen = new Set<WisdomCategory>();
    entries.forEach((e) => seen.add(e.category));
    return Array.from(seen);
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesCat = activeCategory === ALL || e.category === activeCategory;
      const matchesQuery =
        !q ||
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q) ||
        e.origin.toLowerCase().includes(q) ||
        (e.source?.toLowerCase().includes(q) ?? false);
      return matchesCat && matchesQuery;
    });
  }, [entries, query, activeCategory]);

  const pickRandom = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : entries;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setExpanded(pick.id);
    setTimeout(() => {
      document.getElementById(`wisdom-${pick.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, [filtered, entries]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="px-6 py-20 bg-gradient-to-b from-gray-900 to-gray-950 border-b border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">The Living Library</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Law · Wisdom · Etymology<br className="hidden sm:block" /> · Philosophy · Universe
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Every great civilisation left knowledge behind. This is the collection — ancient laws, forgotten origins of words, timeless wisdom, and the mysteries of the cosmos.
          </p>

          {/* Search + Random */}
          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search wisdom, law, words…"
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={pickRandom}
              className="rounded-xl border border-brand-500/40 bg-brand-500/10 px-5 py-3 text-sm font-semibold text-brand-400 hover:bg-brand-500/20 transition-colors whitespace-nowrap"
            >
              ✦ Random
            </button>
          </div>
        </div>
      </section>

      {/* Daily Wisdom */}
      <section className="px-6 py-8 bg-gray-900/50 border-b border-white/5">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">✦ Today&apos;s Wisdom</p>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{CATEGORY_ICONS[daily.category]}</span>
              <div>
                <h3 className="text-xl font-bold text-white">{daily.term}</h3>
                <p className="text-xs text-amber-400 mt-0.5">{daily.origin} · {CATEGORY_LABELS[daily.category]}</p>
                <p className="mt-3 text-gray-300 text-sm leading-relaxed">{daily.definition}</p>
                {daily.source && <p className="mt-2 text-xs text-gray-600">— {daily.source}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category filters */}
      <section className="px-6 py-6 border-b border-white/5 sticky top-0 z-10 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(ALL)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === ALL
                  ? "bg-brand-500 text-white"
                  : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              All ({entries.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? "bg-brand-500 text-white"
                    : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs text-gray-600 mb-6">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</p>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📖</p>
              <p className="text-gray-400">No wisdom found for &ldquo;{query}&rdquo;</p>
              <button onClick={() => { setQuery(""); setActiveCategory(ALL); }} className="mt-4 text-sm text-brand-400 hover:underline">
                Clear filters
              </button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => {
              const isOpen = expanded === entry.id;
              return (
                <div
                  key={entry.id}
                  id={`wisdom-${entry.id}`}
                  className={`rounded-2xl border transition-all cursor-pointer ${
                    isOpen
                      ? "border-brand-500/40 bg-brand-500/5 sm:col-span-2 lg:col-span-3"
                      : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                  }`}
                  onClick={() => setExpanded(isOpen ? null : entry.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{CATEGORY_ICONS[entry.category]}</span>
                        <div>
                          <h3 className="font-bold text-white text-base">{entry.term}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{entry.origin}</p>
                        </div>
                      </div>
                      <span className={`text-xs rounded-full px-2 py-0.5 border flex-shrink-0 ${
                        isOpen
                          ? "border-brand-500/30 text-brand-400 bg-brand-500/10"
                          : "border-white/10 text-gray-600"
                      }`}>
                        {CATEGORY_LABELS[entry.category]}
                      </span>
                    </div>

                    {!isOpen && (
                      <p className="mt-3 text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {entry.definition}
                      </p>
                    )}

                    {isOpen && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-gray-300 leading-relaxed">{entry.definition}</p>
                        {entry.example && (
                          <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Example</p>
                            <p className="text-sm text-gray-300 italic">{entry.example}</p>
                          </div>
                        )}
                        {entry.source && (
                          <p className="text-xs text-gray-600">— {entry.source}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
