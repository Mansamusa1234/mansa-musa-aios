"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "tools" | "activity" | "leaderboard" | "payouts";

interface Conversion {
  id: string;
  status: string;
  commissionCents: number;
  createdAt: Date;
  payoutStatus: string | null;
}

interface LeaderboardEntry {
  rank: number;
  maskedCode: string;
  totalEarningsCents: number;
  conversions: number;
  clicks: number;
  isCurrentUser: boolean;
}

interface AffiliateInfo {
  code: string;
  clicks: number;
  commissionRate: number;
  couponCode: string | null;
  socialHandle: string | null;
}

interface Props {
  affiliate: AffiliateInfo | null;
  conversions: Conversion[];
  totalCommissionCents: number;
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",    label: "Overview",    icon: "📊" },
  { id: "tools",       label: "Tools",       icon: "🛠️" },
  { id: "activity",    label: "Activity",    icon: "📈" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
  { id: "payouts",     label: "Payouts",     icon: "💳" },
];

const UTM_PRESETS: Record<string, { source: string; medium: string; campaign: string; label: string }> = {
  twitter:  { source: "twitter",  medium: "social",     campaign: "affiliate", label: "𝕏 Twitter"  },
  linkedin: { source: "linkedin", medium: "social",     campaign: "affiliate", label: "in LinkedIn" },
  youtube:  { source: "youtube",  medium: "video",      campaign: "affiliate", label: "▶ YouTube"   },
  email:    { source: "email",    medium: "newsletter", campaign: "affiliate", label: "✉ Email"     },
  whatsapp: { source: "whatsapp", medium: "social",     campaign: "affiliate", label: "💬 WhatsApp" },
};

const PAYOUT_STYLES: Record<string, string> = {
  PENDING:  "bg-gray-500/15 text-gray-400",
  APPROVED: "bg-blue-500/15 text-blue-300",
  PAID:     "bg-green-500/15 text-green-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

const PAYOUT_LABELS: Record<string, string> = {
  PENDING: "Pending", APPROVED: "Approved", PAID: "Paid", REJECTED: "Rejected",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTier(count: number) {
  if (count >= 51) return { name: "Gold",   icon: "🥇", color: "text-amber-400", border: "border-amber-500/30",  bg: "bg-amber-500/8",  rate: 25, next: null,     threshold: 51 };
  if (count >= 11) return { name: "Silver", icon: "🥈", color: "text-gray-300",  border: "border-gray-500/30",   bg: "bg-gray-500/8",   rate: 22, next: "Gold",   threshold: 51 };
  return                  { name: "Bronze", icon: "🥉", color: "text-amber-600", border: "border-amber-700/30",  bg: "bg-amber-800/8",  rate: 20, next: "Silver", threshold: 11 };
}

function buildUTMLink(base: string, source: string, medium: string, campaign: string) {
  if (!source && !medium && !campaign) return base;
  try {
    const url = new URL(base);
    if (source)   url.searchParams.set("utm_source",   source);
    if (medium)   url.searchParams.set("utm_medium",   medium);
    if (campaign) url.searchParams.set("utm_campaign", campaign);
    return url.toString();
  } catch { return base; }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AffiliateContent({
  affiliate,
  conversions,
  totalCommissionCents,
  leaderboard,
  currentUserRank,
}: Props) {
  const [applying, setApplying]         = useState(false);
  const [code, setCode]                 = useState(affiliate?.code ?? null);
  const [activeTab, setActiveTab]       = useState<Tab>("overview");
  const [copied, setCopied]             = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl]       = useState("");
  const [qrLoading, setQrLoading]       = useState(false);
  const [utmSource, setUtmSource]       = useState("");
  const [utmMedium, setUtmMedium]       = useState("");
  const [utmCampaign, setUtmCampaign]   = useState("");
  const [showPayout, setShowPayout]     = useState(false);
  const [payoutBusy, setPayoutBusy]     = useState(false);
  const [payoutOk, setPayoutOk]         = useState(false);
  const [payoutErr, setPayoutErr]       = useState("");

  const origin   = typeof window !== "undefined" ? window.location.origin : "https://mansamusainitiative.com";
  const link     = code ? `${origin}/go/${code}` : "";
  const utmLink  = link ? buildUTMLink(link, utmSource, utmMedium, utmCampaign) : "";

  const conversionCount = conversions.filter((c) => c.status === "CONVERTED").length;
  const tier            = getTier(conversionCount);
  const tierProgress    = tier.name === "Gold" ? 100 : Math.min(100, (conversionCount / tier.threshold) * 100);

  // Apply
  async function apply() {
    setApplying(true);
    try {
      const res = await fetch("/api/affiliate/apply", { method: "POST" });
      if (res.ok) setCode((await res.json()).code);
    } finally { setApplying(false); }
  }

  // Copy helper
  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  // QR code generation (dynamic import to avoid SSR issues)
  const generateQR = useCallback(async (url: string) => {
    if (!url) return;
    setQrLoading(true);
    try {
      const mod = await import("qrcode");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCode = (mod as any).default ?? mod;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 240, margin: 2,
        color: { dark: "#6366f1", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } finally { setQrLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "tools" && link) generateQR(utmLink || link);
  }, [activeTab, utmLink, link, generateQR]);

  // Payout request
  async function requestPayout() {
    setPayoutBusy(true);
    setPayoutErr("");
    try {
      const res  = await fetch("/api/affiliate/request-payout", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPayoutOk(true);
        setTimeout(() => { setShowPayout(false); setPayoutOk(false); }, 3000);
      } else {
        setPayoutErr(data.error ?? "Something went wrong");
      }
    } finally { setPayoutBusy(false); }
  }

  // ── Not yet applied ──────────────────────────────────────────────────────
  if (!affiliate && !code) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Affiliate Programme ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Earn commission promoting MansaMusaAI</h1>
          <p className="mt-1 text-sm text-gray-500">Trackable link, 20% recurring commission, monthly payouts.</p>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Commission",  value: "20%",     sub: "Recurring" },
            { label: "Cookie",      value: "60 days", sub: "Tracking window" },
            { label: "Payouts",     value: "Monthly", sub: "Min £50" },
            { label: "Top tier",    value: "25%",     sub: "Gold affiliate" },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
              <p className="text-xl font-extrabold text-brand-400">{s.value}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">🤝</div>
          <p className="text-gray-300 font-medium mb-1">You're not an affiliate yet</p>
          <p className="text-sm text-gray-600 mb-5">Join in one click — no review, no wait. Start sharing immediately.</p>
          <button
            onClick={apply}
            disabled={applying}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {applying ? "Joining…" : "Become an affiliate →"}
          </button>
        </motion.div>

        {leaderboard.length > 0 && (
          <motion.div variants={fadeUp}>
            <h2 className="text-sm font-bold text-white mb-3">Top affiliates</h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
                    <span className="font-mono text-sm text-gray-400">{entry.maskedCode}</span>
                  </div>
                  <span className="text-sm font-bold text-brand-400">£{(entry.totalEarningsCents / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Affiliate Programme ·</p>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Your affiliate dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Earning <span className="font-semibold text-brand-400">{affiliate?.commissionRate ?? 20}%</span> commission.
          {currentUserRank && <span className="ml-2 text-gray-600"> Ranked #{currentUserRank} globally.</span>}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                : "text-gray-500 hover:text-gray-300 border border-transparent"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Link clicks",      value: affiliate?.clicks ?? 0,    prefix: ""  },
                  { label: "Conversions",       value: conversionCount,            prefix: ""  },
                  { label: "Commission earned", value: totalCommissionCents / 100, prefix: "£" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
                    <p className="text-xl font-extrabold text-brand-400">{s.prefix}<CountUp value={s.value} /></p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tier card */}
              <div className={`rounded-2xl border ${tier.border} ${tier.bg} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tier.icon}</span>
                    <div>
                      <p className={`font-bold text-sm ${tier.color}`}>{tier.name} Affiliate</p>
                      <p className="text-xs text-gray-500">{tier.rate}% commission rate</p>
                    </div>
                  </div>
                  {tier.next && (
                    <p className="text-xs text-gray-600 text-right">
                      {tier.threshold - conversionCount} more conversions<br />
                      <span className="text-gray-500">for {tier.next}</span>
                    </p>
                  )}
                </div>
                {tier.next && (
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-700"
                      style={{ width: `${tierProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Referral link */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
                <p className="text-sm font-bold text-white">Your referral link</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly value={link}
                    className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-gray-300 outline-none truncate"
                  />
                  <button
                    onClick={() => copyText(link, "base")}
                    className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shrink-0"
                  >
                    {copied === "base" ? "Copied ✓" : "Copy link"}
                  </button>
                </div>

                {/* Quick share */}
                <div>
                  <p className="text-[10px] text-gray-600 mb-2">Quick share</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: "𝕏 Twitter",
                        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use MansaMusaAI every day — 41 AI agents deployed for my business.\n\nFree to start: ${link} #AI #SaaS`)}`,
                      },
                      {
                        label: "in LinkedIn",
                        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
                      },
                      {
                        label: "💬 WhatsApp",
                        href: `https://wa.me/?text=${encodeURIComponent(`Check out MansaMusaAI — 41 AI agents for your business, free to start: ${link}`)}`,
                      },
                    ].map((btn) => (
                      <a
                        key={btn.label}
                        href={btn.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:border-white/15 transition-colors"
                      >
                        {btn.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coupon code (if set by admin) */}
              {affiliate?.couponCode && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1">Your discount code</p>
                      <p className="text-xl font-mono font-bold text-white">{affiliate.couponCode}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Share this with your audience for an extra discount.</p>
                    </div>
                    <button
                      onClick={() => copyText(affiliate.couponCode!, "coupon")}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                    >
                      {copied === "coupon" ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GROWTH TOOLS ─────────────────────────────────────────────── */}
          {activeTab === "tools" && (
            <div className="space-y-5">
              {/* QR Code */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <p className="text-sm font-bold text-white mb-0.5">QR Code</p>
                <p className="text-xs text-gray-500 mb-4">Perfect for print materials, slides, and in-person events.</p>
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex h-[240px] w-[240px] shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/8">
                    {qrLoading ? (
                      <p className="text-xs text-gray-600">Generating…</p>
                    ) : qrDataUrl ? (
                      <img src={qrDataUrl} alt="Affiliate QR code" className="rounded-lg" />
                    ) : (
                      <p className="text-xs text-gray-600">No QR yet</p>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Your QR code encodes your UTM link (if configured below) or your base referral link.
                    </p>
                    <button
                      onClick={() => generateQR(utmLink || link)}
                      className="block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                    >
                      Refresh QR
                    </button>
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download="mansamusaai-affiliate-qr.png"
                        className="block rounded-xl border border-brand-500/20 bg-brand-500/8 px-4 py-2 text-center text-xs font-semibold text-brand-400 hover:bg-brand-500/15 transition-colors"
                      >
                        ↓ Download QR PNG
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* UTM Builder */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">UTM Link Builder</p>
                  <p className="text-xs text-gray-500">Track exactly where your conversions come from.</p>
                </div>

                {/* Platform presets */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(UTM_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => { setUtmSource(preset.source); setUtmMedium(preset.medium); setUtmCampaign(preset.campaign); }}
                      className="rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:border-white/15 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      { label: "Source",   placeholder: "e.g. twitter",   value: utmSource,   setter: setUtmSource   },
                      { label: "Medium",   placeholder: "e.g. social",    value: utmMedium,   setter: setUtmMedium   },
                      { label: "Campaign", placeholder: "e.g. affiliate", value: utmCampaign, setter: setUtmCampaign },
                    ] as const
                  ).map((field) => (
                    <div key={field.label}>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1">
                        utm_{field.label.toLowerCase()}
                      </label>
                      <input
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-gray-300 outline-none focus:border-brand-500/40 placeholder-gray-700 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                {utmLink !== link && utmLink && (
                  <div className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Generated UTM link</p>
                    <p className="text-xs font-mono text-gray-400 break-all">{utmLink}</p>
                    <button
                      onClick={() => copyText(utmLink, "utm")}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
                    >
                      {copied === "utm" ? "Copied ✓" : "Copy UTM link"}
                    </button>
                  </div>
                )}
              </div>

              {/* Social templates */}
              <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">Social media templates</p>
                  <p className="text-xs text-gray-500">Copy-ready posts. Uses your UTM link if configured.</p>
                </div>
                {[
                  {
                    platform: "𝕏 Twitter / X",
                    key: "tw",
                    text: `I use MansaMusaAI every day — 41 AI agents deployed for my business. Strategy, finance, legal, marketing — all automated.\n\nFree to start: ${utmLink || link}\n\n#AI #Productivity #SaaS`,
                  },
                  {
                    platform: "in LinkedIn",
                    key: "li",
                    text: `I've been using MansaMusaAI to run a full AI workforce — CEO, CFO, Legal, Marketing agents all working in parallel.\n\nThe Wisdom Arena alone is worth it: 6 AI agents debate your hardest questions, critique each other, and produce a scored answer.\n\nFree plan available: ${utmLink || link}`,
                  },
                  {
                    platform: "💬 WhatsApp",
                    key: "wa",
                    text: `Check out MansaMusaAI — it's like having a whole AI team for your business. 41 agents, free to start: ${utmLink || link}`,
                  },
                ].map((t) => (
                  <div key={t.key} className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">{t.platform}</p>
                    <p className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">{t.text}</p>
                    <button
                      onClick={() => copyText(t.text, `social-${t.key}`)}
                      className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                    >
                      {copied === `social-${t.key}` ? "Copied ✓" : "Copy post"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ACTIVITY ─────────────────────────────────────────────────── */}
          {activeTab === "activity" && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-white">Conversion history</p>
              {conversions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">📈</div>
                  <p className="text-gray-400 font-medium">No signups yet.</p>
                  <p className="mt-1 text-sm text-gray-600">Share your link to start earning.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-4">
                      <div>
                        <p className="text-sm font-medium text-white">Referred signup</p>
                        <p className="text-xs text-gray-600">
                          {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status === "CONVERTED" ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"}`}>
                          {c.status === "CONVERTED" ? "Converted" : "Signed up"}
                        </span>
                        {c.commissionCents > 0 && (
                          <p className="text-xs font-bold text-brand-400">£{(c.commissionCents / 100).toFixed(2)}</p>
                        )}
                        {c.payoutStatus && (
                          <p className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${PAYOUT_STYLES[c.payoutStatus] ?? PAYOUT_STYLES.PENDING}`}>
                            {PAYOUT_LABELS[c.payoutStatus] ?? c.payoutStatus}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LEADERBOARD ──────────────────────────────────────────────── */}
          {activeTab === "leaderboard" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Top affiliates</p>
                {currentUserRank && (
                  <span className="text-xs font-semibold text-brand-400">Your rank: #{currentUserRank}</span>
                )}
              </div>
              {leaderboard.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <p className="text-gray-400">No affiliates yet — you could be first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${
                        entry.isCurrentUser
                          ? "border-brand-500/30 bg-brand-500/8"
                          : "border-white/8 bg-white/3"
                      }`}
                    >
                      <span className="w-8 shrink-0 text-center text-lg">
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                      </span>
                      <span className={`flex-1 font-mono text-sm ${entry.isCurrentUser ? "text-brand-400 font-semibold" : "text-gray-400"}`}>
                        {entry.maskedCode}
                        {entry.isCurrentUser && <span className="ml-2 text-[10px] font-normal opacity-60">(you)</span>}
                      </span>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">£{(entry.totalEarningsCents / 100).toFixed(0)}</p>
                        <p className="text-[10px] text-gray-600">{entry.conversions} conversions</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-700 text-center pt-1">Codes are anonymised — only first 3 characters shown.</p>
            </div>
          )}

          {/* ── PAYOUTS ──────────────────────────────────────────────────── */}
          {activeTab === "payouts" && (() => {
            const pendingCents  = conversions.filter((c) => c.payoutStatus === "PENDING").reduce((s, c)  => s + c.commissionCents, 0);
            const approvedCents = conversions.filter((c) => c.payoutStatus === "APPROVED").reduce((s, c) => s + c.commissionCents, 0);
            const paidCents     = conversions.filter((c) => c.payoutStatus === "PAID").reduce((s, c)     => s + c.commissionCents, 0);
            return (
              <div className="space-y-5">
                <p className="text-sm font-bold text-white">Commission summary</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Pending review", value: pendingCents,  style: "text-gray-300",  border: "border-gray-500/20",  bg: "bg-gray-500/5"  },
                    { label: "Approved",        value: approvedCents, style: "text-blue-300",  border: "border-blue-500/20",  bg: "bg-blue-500/5"  },
                    { label: "Paid out",        value: paidCents,     style: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/5" },
                  ].map((row) => (
                    <div key={row.label} className={`rounded-2xl border ${row.border} ${row.bg} p-4 text-center`}>
                      <p className={`text-xl font-extrabold ${row.style}`}>£{(row.value / 100).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{row.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-brand-500/20 bg-brand-500/8 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total earned</p>
                    <p className="text-2xl font-extrabold text-brand-400">£{(totalCommissionCents / 100).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => setShowPayout(true)}
                    className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shrink-0"
                  >
                    Request payout →
                  </button>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-400">Payout process:</span> Minimum £50 per request. Reviewed within 5 business days. Payment sent via bank transfer or PayPal. Email{" "}
                    <span className="text-brand-400">affiliates@mansamusainitiative.com</span> with your payment details before requesting.
                  </p>
                </div>
              </div>
            );
          })()}

        </motion.div>
      </AnimatePresence>

      {/* ── Payout modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPayout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowPayout(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0e1a] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">Request payout</h2>
                <button onClick={() => setShowPayout(false)} className="text-gray-600 hover:text-gray-400 text-xl leading-none">✕</button>
              </div>

              {payoutOk ? (
                <div className="py-4 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold text-green-400">Request submitted!</p>
                  <p className="text-sm text-gray-500 mt-1">We'll process your payout within 5 business days.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-white/8 bg-white/3 p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Requesting payout of</p>
                    <p className="text-3xl font-extrabold text-brand-400">£{(totalCommissionCents / 100).toFixed(2)}</p>
                    <p className="text-xs text-gray-600 mt-1">from {conversionCount} conversions</p>
                  </div>
                  {payoutErr && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 mb-4 text-xs text-red-400">
                      {payoutErr}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                    By requesting you confirm your payment details are on file. If not, email{" "}
                    <span className="text-brand-400">affiliates@mansamusainitiative.com</span> first.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPayout(false)}
                      className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={requestPayout}
                      disabled={payoutBusy}
                      className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    >
                      {payoutBusy ? "Submitting…" : "Confirm request"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
