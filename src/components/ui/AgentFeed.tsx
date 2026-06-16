"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EVENTS = [
  { agent: "CEO Agent",       icon: "👑", action: "Built Q4 strategic roadmap",      result: "Plan ready for review",        badge: "STRATEGY",  bg: "bg-amber-500/15 text-amber-300"   },
  { agent: "Finance Agent",   icon: "💰", action: "Completed P&L analysis",           result: "£48k savings identified",      badge: "FINANCE",   bg: "bg-green-500/15 text-green-300"   },
  { agent: "Research Agent",  icon: "🔬", action: "Scanned 47 market reports",        result: "3 growth signals found",       badge: "RESEARCH",  bg: "bg-blue-500/15 text-blue-300"     },
  { agent: "Legal Agent",     icon: "⚖️", action: "Reviewed contract #4821",          result: "2 risk clauses flagged",       badge: "LEGAL",     bg: "bg-red-500/15 text-red-300"       },
  { agent: "Marketing Agent", icon: "📣", action: "Generated 5 ad variants",          result: "Est. 32% CTR lift",            badge: "MARKETING", bg: "bg-purple-500/15 text-purple-300" },
  { agent: "Developer Agent", icon: "⚡", action: "Refactored 3 API routes",          result: "Latency ↓ 40%",               badge: "DEV",        bg: "bg-yellow-500/15 text-yellow-300" },
  { agent: "Security Agent",  icon: "🔒", action: "Vulnerability scan complete",      result: "All systems nominal ✓",        badge: "SECURITY",  bg: "bg-emerald-500/15 text-emerald-300"},
  { agent: "Sales Agent",     icon: "💼", action: "Scored 120 inbound leads",         result: "18 hot prospects surfaced",    badge: "SALES",     bg: "bg-indigo-500/15 text-indigo-300" },
  { agent: "Support Agent",   icon: "🎧", action: "Resolved 14 open tickets",         result: "CSAT score 98 / 100",          badge: "SUPPORT",   bg: "bg-teal-500/15 text-teal-300"     },
  { agent: "Document Agent",  icon: "📄", action: "Processed 8 uploaded documents",   result: "Data extracted & indexed",     badge: "DOCS",      bg: "bg-orange-500/15 text-orange-300" },
];

function ts() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

type Item = { id: number; e: typeof EVENTS[number]; ts: string };

export default function AgentFeed({ maxItems = 5 }: { maxItems?: number }) {
  const idRef = useRef(EVENTS.length);
  const [items, setItems] = useState<Item[]>(() =>
    EVENTS.slice(0, maxItems - 1).map((e, i) => ({ id: i, e, ts: ts() }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const id = idRef.current++;
      setItems((prev) => [{ id, e, ts: ts() }, ...prev].slice(0, maxItems));
    }, 2800);
    return () => clearInterval(interval);
  }, [maxItems]);

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          <span className="text-xs font-semibold text-white tracking-wide">Live Agent Activity</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">REAL-TIME</span>
      </div>

      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 backdrop-blur-sm"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5 flex-shrink-0">{item.e.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-white">{item.e.agent}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.e.bg}`}>
                    {item.e.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{item.e.action}</p>
                <p className="text-[11px] text-green-400 mt-0.5 leading-tight">{item.e.result}</p>
              </div>
              <span className="text-[9px] text-gray-600 font-mono flex-shrink-0 mt-0.5">{item.ts}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
