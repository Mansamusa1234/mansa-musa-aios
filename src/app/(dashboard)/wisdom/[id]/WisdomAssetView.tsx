"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { CATEGORY_META } from "@/lib/wisdomAgents";
import Link from "next/link";

interface Entry {
  agentName: string; agentIcon: string; agentColor: string;
  score: number; rank: number; rationale: string; response: string;
}
interface Props {
  asset: {
    id: string; title: string; content: string; category: string; prompt: string;
    agentName: string; agentIcon: string; agentColor: string;
    views: number; saves: number; avgRating: number; ratingCount: number;
    createdAt: string; userRating: number | null; entries: Entry[];
  };
}

export default function WisdomAssetView({ asset }: Props) {
  const [userRating, setUserRating] = useState<number | null>(asset.userRating);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const meta = CATEGORY_META[asset.category as keyof typeof CATEGORY_META];

  async function rate(rating: number) {
    setUserRating(rating);
    await fetch(`/api/wisdom/assets/${asset.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Link href="/wisdom" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">← Wisdom Vault</Link>
        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{ backgroundColor: `${asset.agentColor}25` }}>
            {asset.agentIcon}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">{asset.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full px-2 py-0.5 font-bold"
                style={{ backgroundColor: `${meta?.color ?? "#6366f1"}20`, color: meta?.color ?? "#6366f1" }}>
                {meta?.icon} {meta?.label ?? asset.category}
              </span>
              <span>Won by {asset.agentName}</span>
              <span>{asset.views} views</span>
              <span>{new Date(asset.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Prompt */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Competition prompt</p>
        <p className="text-sm italic text-gray-400">{asset.prompt}</p>
      </div>

      {/* Winning response */}
      <div className="rounded-2xl border border-brand-500/25 bg-brand-500/4 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-3">🏆 Winning answer — {asset.agentName}</p>
        <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">{asset.content}</p>
      </div>

      {/* Rate this asset */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <p className="text-xs font-bold text-white mb-3">Rate this wisdom</p>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              onClick={() => rate(n)}
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(null)}
              className="text-2xl transition-transform hover:scale-110"
            >
              <span className={n <= (hoveredStar ?? userRating ?? 0) ? "text-amber-400" : "text-gray-500"}>★</span>
            </button>
          ))}
          {asset.ratingCount > 0 && (
            <span className="ml-2 text-xs text-gray-600">
              {asset.avgRating.toFixed(1)} avg · {asset.ratingCount} rating{asset.ratingCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Full scoreboard */}
      {asset.entries.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-white">Full competition results</h2>
          <div className="space-y-3">
            {asset.entries.map((entry) => {
              const isWinner = entry.rank === 1;
              return (
                <div
                  key={entry.agentName}
                  className={`rounded-xl border p-4 ${isWinner ? "border-amber-400/30 bg-amber-500/8" : "border-white/8 bg-white/3"}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{entry.agentIcon}</span>
                      <span className="text-sm font-bold text-white">{entry.agentName}</span>
                      {isWinner && <span className="text-[9px] font-bold text-amber-300 rounded-full bg-amber-500/20 px-2 py-0.5">🏆 WINNER</span>}
                    </div>
                    <span className={`text-sm font-extrabold ${isWinner ? "text-amber-300" : "text-brand-400"}`}>{entry.score}/100</span>
                  </div>
                  <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                    <div className={`h-full rounded-full ${isWinner ? "bg-amber-400" : "bg-brand-500"}`} style={{ width: `${entry.score}%` }} />
                  </div>
                  <p className="text-xs leading-relaxed text-gray-500 line-clamp-3">{entry.response}</p>
                  {entry.rationale && <p className="mt-1 text-[11px] italic text-gray-600">{entry.rationale}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 pb-8">
        <Link href="/compete" className="rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
          ⚔️ Run a new competition
        </Link>
        <Link href="/wisdom" className="rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/8 transition-colors">
          ← Wisdom Vault
        </Link>
      </div>
    </div>
  );
}
