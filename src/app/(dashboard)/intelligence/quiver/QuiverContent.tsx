"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/motion";

type DataTab = "congress" | "senate" | "house" | "insiders" | "contracts" | "lobbying";

const TABS: { id: DataTab; label: string; description: string }[] = [
  { id: "congress", label: "Congress",      description: "All congressional trades (House + Senate combined)" },
  { id: "senate",   label: "Senate",        description: "Senate financial disclosure trades" },
  { id: "house",    label: "House",         description: "House of Representatives financial disclosures" },
  { id: "insiders", label: "Insiders",      description: "SEC-reported insider buy/sell transactions" },
  { id: "contracts",label: "Gov Contracts", description: "Federal government contract awards" },
  { id: "lobbying", label: "Lobbying",      description: "Corporate lobbying expenditure filings" },
];

type Row = Record<string, unknown>;

export default function QuiverContent() {
  const [inputTicker, setInputTicker] = useState("AAPL");
  const [ticker, setTicker]           = useState("AAPL");
  const [activeTab, setActiveTab]     = useState<DataTab>("congress");
  const [data, setData]               = useState<Row[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [analysis, setAnalysis]       = useState<string | null>(null);
  const [analyzing, setAnalyzing]     = useState(false);

  const fetchData = useCallback(async (tab: DataTab, sym: string) => {
    setLoading(true);
    setError(null);
    setData([]);
    try {
      const res  = await fetch(`/api/intelligence/quiver/${tab}?ticker=${encodeURIComponent(sym)}`);
      const json = await res.json() as { data?: Row[]; error?: string };
      if (!res.ok) { setError(json.error ?? "Failed to fetch data"); return; }
      setData(json.data ?? []);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(activeTab, ticker); }, [activeTab, ticker, fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const t = inputTicker.trim().toUpperCase();
    if (!t) return;
    setTicker(t);
    setAnalysis(null);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res  = await fetch("/api/intelligence/quiver/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      const json = await res.json() as { analysis?: string; error?: string };
      if (!res.ok) { setAnalysis(`Error: ${json.error ?? "Unknown error"}`); return; }
      setAnalysis(json.analysis ?? "");
    } catch {
      setAnalysis("Failed to generate analysis. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  // Derive columns from first row, capped at 7 to avoid overflow
  const columns = data.length > 0 ? Object.keys(data[0]).slice(0, 7) : [];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">
              · Alternative Data ·
            </p>
            <h1 className="text-2xl font-extrabold text-white">Mansa Market Intelligence</h1>
            <p className="mt-1 text-sm text-gray-500">
              Congressional trades · Insider activity · Gov contracts · Lobbying — via Quiver Quantitative
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
            </span>
            <span className="text-xs font-semibold text-brand-400">LIVE DATA</span>
          </div>
        </motion.div>

        {/* Ticker search */}
        <motion.form variants={fadeUp} onSubmit={handleSearch} className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (e.g. AAPL, MSFT, NVDA)"
            maxLength={10}
            className="flex-1 min-w-[160px] max-w-xs rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-300 hover:bg-brand-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
                Analysing…
              </span>
            ) : (
              "✦ AI Analysis"
            )}
          </button>
        </motion.form>

        {/* Tabs */}
        <motion.div variants={fadeUp} className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              title={t.description}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === t.id
                  ? "bg-brand-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* ── AI Analysis panel ─────────────────────────────── */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5"
        >
          <h2 className="mb-3 text-sm font-bold text-brand-300">
            ✦ AI Intelligence Report — {ticker}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis}</p>
          <p className="mt-4 text-[10px] text-gray-500">
            This report is generated from publicly available regulatory filings and should not be
            construed as investment advice. Past alternative-data signals do not guarantee future
            results. Always conduct your own due diligence.
          </p>
        </motion.div>
      )}

      {/* ── Data table ───────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-white">
              {TABS.find((t) => t.id === activeTab)?.label} — {ticker}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {TABS.find((t) => t.id === activeTab)?.description}
            </p>
          </div>
          <span className="text-[11px] text-gray-500">{data.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
            Loading…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-red-400">
            <span>⚠ {error}</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <span>No {TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} data found for <strong className="text-gray-300">{ticker}</strong></span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/6">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors"
                  >
                    {columns.map((col) => {
                      const val = row[col];
                      const display = val === null || val === undefined ? "—" : String(val);
                      return (
                        <td
                          key={col}
                          className="px-4 py-2.5 text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 50 && (
              <p className="px-4 py-3 text-[11px] text-gray-500 border-t border-white/4">
                Showing 50 of {data.length} records.
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed">
        Data sourced from public regulatory filings via Quiver Quantitative. Congressional and
        insider trading data reflects legally required disclosures — it does not constitute
        confidential or non-public material information. This page is for informational purposes
        only and is not investment advice.
      </p>
    </div>
  );
}
