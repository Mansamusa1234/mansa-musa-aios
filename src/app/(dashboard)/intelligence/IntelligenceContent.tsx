"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

interface Index {
  name: string;
  base: number;
  decimals: number;
  prefix: string;
  pctVol: number; // simulated per-tick volatility, as a fraction
}

const INDEX_SEEDS: Index[] = [
  { name: "FTSE 100",   base: 7842.30,  decimals: 2, prefix: "",  pctVol: 0.0006 },
  { name: "S&P 500",    base: 5912.40,  decimals: 2, prefix: "",  pctVol: 0.0006 },
  { name: "NASDAQ",     base: 19284.70, decimals: 2, prefix: "",  pctVol: 0.0008 },
  { name: "DAX",        base: 19104.80, decimals: 2, prefix: "",  pctVol: 0.0006 },
  { name: "Nikkei 225", base: 38920.10, decimals: 2, prefix: "",  pctVol: 0.0007 },
  { name: "BTC/USD",    base: 96420,    decimals: 0, prefix: "$", pctVol: 0.002  },
  { name: "ETH/USD",    base: 3241,     decimals: 0, prefix: "$", pctVol: 0.0025 },
  { name: "Gold",       base: 2841,     decimals: 0, prefix: "$", pctVol: 0.0009 },
  { name: "Brent Oil",  base: 78.40,    decimals: 2, prefix: "$", pctVol: 0.0012 },
  { name: "GBP/USD",    base: 1.2648,   decimals: 4, prefix: "",  pctVol: 0.0005 },
];

interface Tick { value: number; pct: number; }

function formatValue(prefix: string, decimals: number, value: number): string {
  return `${prefix}${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Simulated live feed: random-walks each index's value every few seconds. No external API — demo data only. */
function useLiveIndices() {
  const [ticks, setTicks] = useState<Tick[]>(() => INDEX_SEEDS.map((s) => ({ value: s.base, pct: 0 })));
  const lastUpdateRef = useRef(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTicks((prev) =>
        prev.map((t, i) => {
          const seed = INDEX_SEEDS[i];
          const drift = (Math.random() - 0.5) * 2 * seed.pctVol;
          const value = Math.max(0, t.value * (1 + drift));
          const pct = ((value - seed.base) / seed.base) * 100;
          return { value, pct };
        })
      );
      lastUpdateRef.current = Date.now();
      setSecondsAgo(0);
    }, 3000);

    const clockInterval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdateRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const indices = INDEX_SEEDS.map((seed, i) => ({
    name: seed.name,
    value: formatValue(seed.prefix, seed.decimals, ticks[i].value),
    pct: `${ticks[i].pct >= 0 ? "+" : ""}${ticks[i].pct.toFixed(2)}%`,
    up: ticks[i].pct >= 0,
  }));

  return { indices, secondsAgo };
}

const SECTORS = [
  { name: "Technology",    pct: "+2.4%", up: true,  heat: 88 },
  { name: "Financials",    pct: "+1.1%", up: true,  heat: 62 },
  { name: "Healthcare",    pct: "-0.3%", up: false, heat: 40 },
  { name: "Consumer",      pct: "+0.8%", up: true,  heat: 55 },
  { name: "Energy",        pct: "-1.9%", up: false, heat: 18 },
  { name: "Industrials",   pct: "+0.5%", up: true,  heat: 52 },
  { name: "Real Estate",   pct: "-0.7%", up: false, heat: 34 },
  { name: "Utilities",     pct: "+0.2%", up: true,  heat: 46 },
  { name: "Materials",     pct: "+1.3%", up: true,  heat: 68 },
  { name: "AI & Robotics", pct: "+3.1%", up: true,  heat: 95 },
];

const COMPETITORS = [
  { name: "ChatGPT (OpenAI)",  users: "200M+",  funding: "$17.9B",  moat: "Branding, scale",    threat: "High",   threats: 85 },
  { name: "Gemini (Google)",    users: "150M+",  funding: "Internal",moat: "Search + ecosystem", threat: "High",   threats: 80 },
  { name: "Copilot (Microsoft)",users: "100M+",  funding: "Internal",moat: "Office 365 lock-in", threat: "Medium", threats: 65 },
  { name: "Claude (Anthropic)", users: "50M+",   funding: "$7.3B",   moat: "Safety, enterprise", threat: "High",   threats: 78 },
  { name: "Perplexity AI",      users: "30M+",   funding: "$1B",     moat: "Search UX",           threat: "Low",    threats: 35 },
];

const TRENDS = [
  { topic: "Agentic AI workflows",    mentions: 4820, rising: true  },
  { topic: "AI in financial services",mentions: 3290, rising: true  },
  { topic: "Regulatory AI frameworks",mentions: 2810, rising: true  },
  { topic: "RAG & knowledge graphs",  mentions: 2440, rising: true  },
  { topic: "AI agent orchestration",  mentions: 2180, rising: true  },
  { topic: "Model distillation",      mentions: 1950, rising: false },
  { topic: "On-device AI (edge)",     mentions: 1720, rising: true  },
  { topic: "AI code generation",      mentions: 1680, rising: false },
];

function heatColor(h: number) {
  if (h >= 80) return "bg-green-500/30 text-green-300";
  if (h >= 60) return "bg-green-500/15 text-green-400";
  if (h >= 45) return "bg-yellow-500/15 text-yellow-400";
  if (h >= 30) return "bg-orange-500/15 text-orange-400";
  return "bg-red-500/15 text-red-400";
}

export default function IntelligenceContent() {
  const { indices, secondsAgo } = useLiveIndices();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· AI Intelligence ·</p>
            <h1 className="text-2xl font-extrabold text-white">Market Intelligence</h1>
            <p className="mt-1 text-sm text-gray-500">Live market data, competitive intelligence, and sector analysis</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span className="text-xs font-semibold text-green-400">LIVE · {secondsAgo}s ago</span>
          </div>
        </motion.div>

        {/* Market indices */}
        <motion.div variants={fadeUp} className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {indices.slice(0, 5).map((idx) => (
            <div key={idx.name} className="rounded-xl border border-white/8 bg-white/3 p-3">
              <p className="text-[10px] text-gray-400 mb-1">{idx.name}</p>
              <p className="text-sm font-bold text-white">{idx.value}</p>
              <p className={`text-[11px] font-semibold ${idx.up ? "text-green-400" : "text-red-400"}`}>{idx.pct}</p>
            </div>
          ))}
        </motion.div>

        {/* Crypto / commodities */}
        <motion.div variants={fadeUp} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {indices.slice(5).map((idx) => (
            <div key={idx.name} className="rounded-xl border border-white/8 bg-white/3 p-3">
              <p className="text-[10px] text-gray-400 mb-1">{idx.name}</p>
              <p className="text-sm font-bold text-white">{idx.value}</p>
              <p className={`text-[11px] font-semibold ${idx.up ? "text-green-400" : "text-red-400"}`}>{idx.pct}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <p className="text-[10px] text-gray-400">
        Market data is simulated for demo purposes and does not reflect real prices.
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Sector analysis */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold text-white mb-3">Sector Performance</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-2">
            {SECTORS.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-gray-300 truncate">{s.name}</p>
                  <div className="mt-1 h-1 w-full rounded-full bg-white/6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.heat}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                      className={`h-full rounded-full ${s.up ? "bg-green-500" : "bg-red-500"}`}
                    />
                  </div>
                </div>
                <span className={`text-[11px] font-bold flex-shrink-0 ${s.up ? "text-green-400" : "text-red-400"}`}>{s.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Competitive landscape */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold text-white mb-3">Competitive Landscape — AI Platforms</h2>
          <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
            <div className="grid grid-cols-5 border-b border-white/6 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="col-span-2">Company</span>
              <span>Users</span>
              <span>Funding</span>
              <span>Threat</span>
            </div>
            {COMPETITORS.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="grid grid-cols-5 items-center border-b border-white/4 px-4 py-3 last:border-0 hover:bg-white/2 transition-colors"
              >
                <div className="col-span-2 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{c.moat}</p>
                </div>
                <p className="text-[11px] text-gray-400">{c.users}</p>
                <p className="text-[11px] text-gray-400">{c.funding}</p>
                <div>
                  <div className="mb-1 h-1.5 w-full max-w-[60px] rounded-full bg-white/6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.threats}%` }}
                      transition={{ duration: 0.7, delay: i * 0.07 + 0.2 }}
                      className={`h-full rounded-full ${c.threats >= 75 ? "bg-red-500" : c.threats >= 50 ? "bg-yellow-500" : "bg-green-500"}`}
                    />
                  </div>
                  <span className={`text-[9px] font-bold ${c.threats >= 75 ? "text-red-400" : c.threats >= 50 ? "text-yellow-400" : "text-green-400"}`}>
                    {c.threat}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending topics */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Trending in AI & Business</h2>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TRENDS.map((t, i) => (
            <motion.div key={t.topic} variants={scaleIn} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3">
              <span className="text-sm font-bold text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate">{t.topic}</p>
                <p className="text-[10px] text-gray-400">{t.mentions.toLocaleString()} mentions</p>
              </div>
              <span className={`text-[10px] font-bold flex-shrink-0 ${t.rising ? "text-green-400" : "text-gray-400"}`}>
                {t.rising ? "↑" : "→"}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
