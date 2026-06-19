"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import { CATEGORY_META } from "@/lib/wisdomAgents";
import Link from "next/link";

type Category = keyof typeof CATEGORY_META;

interface AssetCard {
  id: string; title: string; category: string; prompt: string; content: string;
  agentName: string; agentIcon: string; agentColor: string;
  views: number; saves: number; avgRating: number; ratingCount: number;
  createdAt: string; userName: string;
}

interface Props {
  assets: AssetCard[];
  totalAssets: number;
  totalCompetitions: number;
}

function stars(n: number) {
  return ["★","★","★","★","★"].map((s, i) => (
    <span key={i} className={i < Math.round(n) ? "text-amber-400" : "text-gray-500"}>{s}</span>
  ));
}

export default function WisdomContent({ assets, totalAssets, totalCompetitions }: Props) {
  const [filter, setFilter] = useState<Category | "ALL">("ALL");

  const categories = Object.keys(CATEGORY_META) as Category[];
  const visible = filter === "ALL" ? assets : assets.filter((a) => a.category === filter);

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Wisdom Vault ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">AI Wisdom Economy</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every competition winner is preserved here. Rated, ranked, and searchable — the world's first AI wisdom library.
          </p>
          <Link href="/compete" className="mt-3 inline-block rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors">
            ⚔️ Run a competition to add wisdom
          </Link>
        </motion.div>

        <motion.div variants={stagger} className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Wisdom assets",   val: totalAssets,       color: "text-brand-400" },
            { label: "Competitions run", val: totalCompetitions, color: "text-amber-400" },
            { label: "Categories",       val: categories.length, color: "text-purple-400" },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
              <p className="mt-0.5 text-xs text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${filter === "ALL" ? "bg-brand-500 text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"}`}
        >
          All
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = assets.filter((a) => a.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${filter === cat ? "text-white" : "border border-white/8 bg-white/3 text-gray-400 hover:bg-white/6"}`}
              style={filter === cat ? { backgroundColor: meta.color } : {}}
            >
              {meta.icon} {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-4">💎</p>
          <p className="text-sm text-gray-500">No wisdom assets yet.</p>
          <Link href="/compete" className="mt-4 inline-block text-xs text-brand-400 hover:underline">
            Run your first competition →
          </Link>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2">
          {visible.map((asset, i) => {
            const meta = CATEGORY_META[asset.category as Category];
            return (
              <motion.div
                key={asset.id}
                variants={scaleIn}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-5 hover:border-white/15 transition-colors"
              >
                {/* Header */}
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${asset.agentColor}25` }}
                  >
                    {asset.agentIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight line-clamp-2">{asset.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: `${meta?.color ?? "#6366f1"}20`, color: meta?.color ?? "#6366f1" }}
                      >
                        {meta?.icon} {meta?.label ?? asset.category}
                      </span>
                      <span className="text-[10px] text-gray-400">by {asset.agentName}</span>
                    </div>
                  </div>
                </div>

                {/* Prompt */}
                <p className="mb-2 text-[11px] italic text-gray-400 line-clamp-1">"{asset.prompt}"</p>

                {/* Preview */}
                <p className="flex-1 text-xs leading-relaxed text-gray-400 line-clamp-4">{asset.content}…</p>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>{stars(asset.avgRating)}</span>
                    {asset.ratingCount > 0 && <span>({asset.ratingCount})</span>}
                    <span>👁 {asset.views}</span>
                  </div>
                  <Link
                    href={`/wisdom/${asset.id}`}
                    className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-[11px] font-bold text-brand-300 hover:bg-brand-500/20 transition-colors"
                  >
                    Read →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
