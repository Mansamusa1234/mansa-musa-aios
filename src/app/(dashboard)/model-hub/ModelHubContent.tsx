"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

type Provider = "anthropic" | "openai" | "grok" | "gemini" | "mistral" | "openrouter";

interface CatalogItem {
  provider: Provider;
  modelId: string;
  displayName: string;
  description: string;
  planGate: string;
  contextWindow: number;
  costPer1kInMicro: number;
  costPer1kOutMicro: number;
  badge: string | null;
  unlocked: boolean;
  available: boolean;
}

interface Preference { mode: string; provider: string; modelId: string }
interface Props { catalog: CatalogItem[]; plan: string; preference: Preference }

const PROVIDER_META: Record<Provider, { name: string; color: string; bg: string; logo: string }> = {
  anthropic:   { name: "Anthropic",   color: "text-orange-400",  bg: "border-orange-500/25 bg-orange-500/5",  logo: "⚙" },
  openai:      { name: "OpenAI",      color: "text-green-400",   bg: "border-green-500/25 bg-green-500/5",    logo: "◎" },
  grok:        { name: "xAI",         color: "text-cyan-400",    bg: "border-cyan-500/25 bg-cyan-500/5",      logo: "✕" },
  gemini:      { name: "Google",      color: "text-blue-400",    bg: "border-blue-500/25 bg-blue-500/5",      logo: "✦" },
  mistral:     { name: "Mistral",     color: "text-purple-400",  bg: "border-purple-500/25 bg-purple-500/5",  logo: "▲" },
  openrouter:  { name: "OpenRouter",  color: "text-pink-400",    bg: "border-pink-500/25 bg-pink-500/5",      logo: "↗" },
};

const TABS = ["Model Selection", "Compare", "Routing Info"] as const;
type Tab = typeof TABS[number];

export default function ModelHubContent({ catalog, plan, preference: initPref }: Props) {
  const [tab, setTab] = useState<Tab>("Model Selection");
  const [pref, setPref] = useState<Preference>(initPref);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filterProvider, setFilterProvider] = useState<Provider | "all">("all");

  /* Compare tab state */
  const [compareModels, setCompareModels] = useState<string[]>([]);
  const [comparePrompt, setComparePrompt] = useState("");
  const [comparing, setComparing] = useState(false);
  const [compareResults, setCompareResults] = useState<{ key: string; displayName: string; provider: string; text: string; error?: boolean }[]>([]);

  const providers = Array.from(new Set(catalog.map((m) => m.provider))) as Provider[];

  const visible = filterProvider === "all" ? catalog : catalog.filter((m) => m.provider === filterProvider);

  async function savePreference(next: Preference) {
    setSaving(true);
    await fetch("/api/model-hub/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setPref(next);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function runCompare() {
    if (!comparePrompt.trim() || compareModels.length < 2) return;
    setComparing(true);
    setCompareResults([]);
    const res = await fetch("/api/model-hub/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: comparePrompt, modelKeys: compareModels }),
    });
    const data = await res.json();
    setCompareResults(data.results ?? []);
    setComparing(false);
  }

  function toggleCompare(key: string) {
    setCompareModels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : prev.length < 4 ? [...prev, key] : prev
    );
  }

  const selectedModel = catalog.find((m) => m.provider === pref.provider && m.modelId === pref.modelId);
  const activeModel = pref.mode === "auto"
    ? catalog.find((m) => m.modelId === (plan === "enterprise" ? "claude-opus-4-8" : plan === "pro" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001"))
    : selectedModel;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-5xl">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· AI ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Model Hub</h1>
          <p className="mt-1 text-sm text-gray-500">Choose your AI model or let us route automatically.</p>
        </div>
        {activeModel && (
          <div className={`rounded-xl border px-3 py-2 text-xs ${PROVIDER_META[activeModel.provider as Provider]?.bg}`}>
            <p className="text-gray-500">Active model</p>
            <p className={`font-bold ${PROVIDER_META[activeModel.provider as Provider]?.color}`}>{PROVIDER_META[activeModel.provider as Provider]?.logo} {activeModel.displayName}</p>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 rounded-xl border border-white/8 bg-white/2 p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${tab === t ? "bg-brand-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {t}
          </button>
        ))}
      </motion.div>

      {/* Model Selection tab */}
      <AnimatePresence mode="wait">
        {tab === "Model Selection" && (
          <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Routing mode */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white">Routing Mode</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { mode: "auto", label: "Auto", desc: "We pick the best model for your plan — always optimised" },
                  { mode: "manual", label: "Manual", desc: "You pick the exact model used for every conversation" },
                ].map(({ mode, label, desc }) => (
                  <button key={mode} onClick={() => savePreference({ ...pref, mode })}
                    className={`text-left rounded-xl border p-4 transition-colors ${pref.mode === mode ? "border-brand-500/50 bg-brand-500/8" : "border-white/8 hover:border-white/16"}`}>
                    <p className={`font-semibold text-sm ${pref.mode === mode ? "text-brand-400" : "text-white"}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider filter */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterProvider("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${filterProvider === "all" ? "border-brand-500/50 bg-brand-500/10 text-brand-400" : "border-white/8 text-gray-500 hover:text-gray-300"}`}>
                All providers
              </button>
              {providers.map((p) => {
                const meta = PROVIDER_META[p];
                return (
                  <button key={p} onClick={() => setFilterProvider(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${filterProvider === p ? `${meta.bg} ${meta.color}` : "border-white/8 text-gray-500 hover:text-gray-300"}`}>
                    {meta.logo} {meta.name}
                  </button>
                );
              })}
            </div>

            {/* Model grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map((model) => {
                const meta = PROVIDER_META[model.provider];
                const key = `${model.provider}:${model.modelId}`;
                const isActive = pref.mode === "manual" && pref.provider === model.provider && pref.modelId === model.modelId;
                const locked = !model.unlocked;
                return (
                  <motion.button key={key} variants={scaleIn}
                    disabled={locked || !model.available || saving}
                    onClick={() => !locked && model.available && savePreference({ mode: "manual", provider: model.provider, modelId: model.modelId })}
                    className={`text-left rounded-2xl border p-4 transition-all ${isActive ? `border-brand-500/50 bg-brand-500/8` : `border-white/8 bg-white/3 hover:border-white/16`} ${locked || !model.available ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-xl ${meta.color}`}>{meta.logo}</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {model.badge && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-brand-500/15 text-brand-400">{model.badge}</span>}
                        {locked && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-400">Upgrade</span>}
                        {!model.available && !locked && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-gray-500/15 text-gray-500">No key</span>}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white leading-snug">{model.displayName}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${meta.color}`}>{meta.name}</p>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{model.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-gray-600">
                      <span>{(model.contextWindow / 1000).toFixed(0)}K ctx</span>
                      <span>· ${(model.costPer1kInMicro / 1000000).toFixed(4)}/1K in</span>
                    </div>
                    {isActive && <p className="mt-2 text-[10px] font-bold text-brand-400">✓ Active</p>}
                  </motion.button>
                );
              })}
            </div>

            {saved && <p className="text-xs text-green-400">Preference saved — applies to new conversations</p>}
          </motion.div>
        )}

        {/* Compare tab */}
        {tab === "Compare" && (
          <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white">Select up to 4 models to compare</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {catalog.filter((m) => m.unlocked && m.available).map((model) => {
                  const key = `${model.provider}:${model.modelId}`;
                  const meta = PROVIDER_META[model.provider];
                  const selected = compareModels.includes(key);
                  return (
                    <button key={key} onClick={() => toggleCompare(key)}
                      className={`text-left rounded-xl border p-3 transition-colors ${selected ? `border-brand-500/50 bg-brand-500/8` : "border-white/8 hover:border-white/16"}`}>
                      <span className={`text-sm ${meta.color}`}>{meta.logo}</span>
                      <p className="text-xs font-semibold text-white mt-1 leading-tight">{model.displayName}</p>
                      <p className={`text-[10px] ${meta.color}`}>{meta.name}</p>
                      {selected && <p className="text-[9px] text-brand-400 font-bold mt-1">Selected</p>}
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={3}
                value={comparePrompt}
                onChange={(e) => setComparePrompt(e.target.value)}
                placeholder="Enter your test prompt..."
                className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none resize-none placeholder-gray-600"
              />
              <button
                onClick={runCompare}
                disabled={compareModels.length < 2 || !comparePrompt.trim() || comparing}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40">
                {comparing ? "Running..." : `Compare ${compareModels.length} models`}
              </button>
            </div>

            {compareResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {compareResults.map((r) => {
                  const provider = r.provider as Provider;
                  const meta = PROVIDER_META[provider];
                  return (
                    <div key={r.key} className={`rounded-2xl border p-4 space-y-2 ${meta.bg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${meta.color}`}>{meta.logo}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{r.displayName}</p>
                          <p className={`text-[10px] ${meta.color}`}>{meta.name}</p>
                        </div>
                      </div>
                      <p className={`text-xs leading-relaxed ${r.error ? "text-red-400" : "text-gray-300"} whitespace-pre-wrap`}>{r.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Routing Info tab */}
        {tab === "Routing Info" && (
          <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white">Smart Routing Logic</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                In <span className="text-brand-400 font-semibold">Auto mode</span>, MansaMusaAI selects the best model based on your subscription plan:
              </p>
              <div className="space-y-2">
                {[
                  { plan: "Free", model: "Claude Haiku 4.5", desc: "Fast, lightweight" },
                  { plan: "Basic", model: "Claude Haiku 4.5", desc: "Fast, lightweight" },
                  { plan: "Pro", model: "Claude Sonnet 4.6", desc: "Balanced intelligence" },
                  { plan: "Enterprise", model: "Claude Opus 4.8", desc: "Max capability" },
                ].map(({ plan: p, model, desc }) => (
                  <div key={p} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${plan === p.toLowerCase() ? "border-brand-500/40 bg-brand-500/5" : "border-white/6"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan === p.toLowerCase() ? "bg-brand-500/20 text-brand-400" : "bg-white/6 text-gray-500"}`}>{p}</span>
                      <p className="text-xs font-semibold text-white">{model}</p>
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
              <h2 className="text-sm font-bold text-white">Provider Availability</h2>
              <p className="text-xs text-gray-500">API keys must be configured in Vercel environment variables.</p>
              <div className="space-y-2">
                {Object.entries(PROVIDER_META).map(([p, meta]) => {
                  const hasModels = catalog.some((m) => m.provider === p && m.available);
                  return (
                    <div key={p} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${meta.color}`}>{meta.logo}</span>
                        <p className="text-xs font-semibold text-white">{meta.name}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasModels ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-500"}`}>
                        {hasModels ? "Connected" : "Not configured"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300/80 leading-relaxed">
              <p className="font-bold text-amber-400 mb-1">Fallback behaviour</p>
              If your chosen manual model is unavailable (API key missing or provider down), MansaMusaAI automatically falls back to Claude Haiku 4.5 so your conversations never break.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
