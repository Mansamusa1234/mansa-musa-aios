"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "tools" | "activity" | "leaderboard" | "payouts";
type Tier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

interface AffiliateInfo {
  id: string;
  code: string;
  tier: Tier;
  commissionRate: number;
  recurringRate: number;
  couponCode: string | null;
  socialHandle: string | null;
  paypalEmail: string | null;
  status: string;
}

interface Stats {
  clicksTotal: number;
  clicks30d: number;
  clicks7d: number;
  conversionsTotal: number;
  conversionRate: number;
  totalEarnedCents: number;
  oneTimeCents: number;
  recurringCents: number;
}

interface ClickPoint { date: string; count: number; }

interface Conversion {
  id: string;
  status: string;
  commissionCents: number;
  recurringTotal: number;
  createdAt: string;
  convertedAt: string | null;
  lastRenewalAt: string | null;
  renewalCount: number;
  payoutStatus: string | null;
}

interface Renewal {
  id: string;
  amountCents: number;
  commissionCents: number;
  paidAt: string;
}

interface PayoutRequest {
  id: string;
  amountCents: number;
  status: string;
  method: string;
  createdAt: string;
  processedAt: string | null;
  adminNote: string | null;
}

interface LeaderboardEntry {
  rank: number;
  maskedCode: string;
  totalEarningsCents: number;
  conversions: number;
  clicks: number;
  isCurrentUser: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; emoji: string; minEarned: number; rate: number }> = {
  BRONZE:   { label: "Bronze",   color: "text-amber-600",  bg: "bg-amber-500/10",  emoji: "🥉", minEarned: 0,      rate: 20 },
  SILVER:   { label: "Silver",   color: "text-slate-400",  bg: "bg-slate-400/10",  emoji: "🥈", minEarned: 5000,   rate: 22 },
  GOLD:     { label: "Gold",     color: "text-yellow-400", bg: "bg-yellow-400/10", emoji: "🥇", minEarned: 20000,  rate: 25 },
  PLATINUM: { label: "Platinum", color: "text-indigo-400", bg: "bg-indigo-400/10", emoji: "💎", minEarned: 50000,  rate: 30 },
};

const TIER_ORDER: Tier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",    label: "Overview",    icon: "📊" },
  { id: "tools",       label: "Tools",       icon: "🛠️" },
  { id: "activity",    label: "Activity",    icon: "📈" },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
  { id: "payouts",     label: "Payouts",     icon: "💰" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function gbp(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(cents / 100);
}

function pct(n: number) { return `${n}%`; }

function relDate(s: string) {
  const d = new Date(s);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Mini bar chart ───────────────────────────────────────────────────────────

function ClickChart({ data }: { data: ClickPoint[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-px h-16">
      {data.map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d.count} clicks`}
          className="flex-1 bg-indigo-500/60 rounded-sm transition-all hover:bg-indigo-400"
          style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AffiliateContent({ leaderboard: initialBoard }: { leaderboard: LeaderboardEntry[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [clickChart, setClickChart] = useState<ClickPoint[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [board, setBoard] = useState<LeaderboardEntry[]>(initialBoard);
  const [applying, setApplying] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("bank");
  const [payoutNote, setPayoutNote] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/affiliate/stats");
    if (!res.ok) return;
    const data = await res.json() as {
      affiliate: AffiliateInfo | null;
      stats: Stats;
      clickChart: ClickPoint[];
      conversions: Conversion[];
      renewals: Renewal[];
      payoutRequests: PayoutRequest[];
    };
    if (data.affiliate) {
      setAffiliate(data.affiliate);
      setPaypalEmail(data.affiliate.paypalEmail ?? "");
      setSocialHandle(data.affiliate.socialHandle ?? "");
    }
    if (data.stats) setStats(data.stats);
    if (data.clickChart) setClickChart(data.clickChart);
    if (data.conversions) setConversions(data.conversions);
    if (data.renewals) setRenewals(data.renewals);
    if (data.payoutRequests) setPayoutRequests(data.payoutRequests);
  }, []);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; loadStats(); }
  }, [loadStats]);

  useEffect(() => {
    if (activeTab !== "leaderboard") return;
    fetch("/api/affiliate/leaderboard").then((r) => r.json()).then((d: { leaderboard?: LeaderboardEntry[] }) => {
      if (d.leaderboard) setBoard(d.leaderboard);
    }).catch(() => {});
  }, [activeTab]);

  const generateQR = useCallback(async (url: string) => {
    if (!url) return;
    setQrLoading(true);
    try {
      const mod = await import("qrcode");
      const QR = ((mod as unknown as { default: unknown }).default ?? mod) as {
        toDataURL: (url: string, opts: object) => Promise<string>;
      };
      const dataUrl = await QR.toDataURL(url, { width: 256, margin: 1, color: { dark: "#ffffff", light: "#0a0a18" } });
      setQrDataUrl(dataUrl);
    } finally { setQrLoading(false); }
  }, []);

  const refLink = affiliate ? `${appOrigin}/r/${affiliate.code}` : "";
  const utmLink  = utmSource && affiliate ? `${appOrigin}/r/${affiliate.code}?utm_source=${encodeURIComponent(utmSource)}` : "";
  const displayLink = utmLink || refLink;

  useEffect(() => {
    if (activeTab === "tools" && displayLink) generateQR(displayLink);
  }, [activeTab, displayLink, generateQR]);

  async function applyAffiliate() {
    setApplying(true); setError("");
    try {
      const res = await fetch("/api/affiliate/apply", { method: "POST" });
      const data = await res.json() as { error?: string };
      if (data.error) { setError(data.error); return; }
      await loadStats();
    } catch { setError("Something went wrong."); }
    finally { setApplying(false); }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => { setCopying(key); setTimeout(() => setCopying(null), 1500); });
  }

  async function requestPayout() {
    setPayoutLoading(true); setError("");
    try {
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: payoutMethod, notes: payoutNote }),
      });
      const data = await res.json() as { error?: string };
      if (data.error) { setError(data.error); return; }
      await loadStats();
      setPayoutNote("");
    } catch { setError("Payout request failed."); }
    finally { setPayoutLoading(false); }
  }

  async function saveProfile() {
    setSavingProfile(true);
    await fetch("/api/affiliate/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paypalEmail, socialHandle }),
    });
    setSavingProfile(false);
    setEditMode(false);
    await loadStats();
  }

  const tier = (affiliate?.tier ?? "BRONZE") as Tier;
  const tc   = TIER_CONFIG[tier];
  const currentTierIdx = TIER_ORDER.indexOf(tier);
  const nextTier       = TIER_ORDER[currentTierIdx + 1] as Tier | undefined;
  const nextTC         = nextTier ? TIER_CONFIG[nextTier] : null;
  const totalEarned    = stats?.totalEarnedCents ?? 0;
  const tierProgress   = nextTC
    ? Math.min(100, ((totalEarned - tc.minEarned) / (nextTC.minEarned - tc.minEarned)) * 100)
    : 100;

  // ── No account yet ───────────────────────────────────────────────────────

  if (!affiliate) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">🤝</div>
        <h1 className="text-3xl font-bold text-white mb-3">Affiliate Programme</h1>
        <p className="text-gray-400 mb-2">
          Earn <span className="text-indigo-400 font-semibold">20% recurring commission</span> every month a subscriber stays active.
        </p>
        <p className="text-gray-500 text-sm mb-8">90-day cookie window · Monthly payouts · Tier bonuses up to 30%</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { emoji: "🔗", label: "Unique link + coupon" },
            { emoji: "📊", label: "Real-time analytics" },
            { emoji: "💎", label: "Up to 30% recurring" },
            { emoji: "💰", label: "Monthly payouts" },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="text-2xl mb-2">{f.emoji}</div>
              <div className="text-xs text-gray-400">{f.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 p-4 mb-8 text-left">
          <h3 className="text-sm font-semibold text-white mb-3">Commission tiers</h3>
          <div className="space-y-2">
            {TIER_ORDER.map((t) => {
              const c = TIER_CONFIG[t];
              return (
                <div key={t} className={`flex items-center justify-between rounded-lg px-3 py-2 ${c.bg}`}>
                  <span className={`text-sm font-medium ${c.color}`}>{c.emoji} {c.label}</span>
                  <span className="text-xs text-gray-400">{pct(c.rate)} recurring · from {gbp(c.minEarned)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={applyAffiliate}
          disabled={applying}
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
        >
          {applying ? "Setting up…" : "Join the programme →"}
        </button>

        {initialBoard.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-sm font-semibold text-white mb-3">Top affiliates</h3>
            <div className="space-y-2">
              {initialBoard.slice(0, 5).map((e) => (
                <div key={e.rank} className="flex items-center justify-between rounded-lg border border-white/6 px-3 py-2">
                  <span className="text-xs text-gray-500">#{e.rank} {e.maskedCode}</span>
                  <span className="text-xs text-indigo-400 font-medium">{gbp(e.totalEarningsCents)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Affiliate Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-semibold ${tc.color}`}>{tc.emoji} {tc.label}</span>
            <span className="text-gray-600">·</span>
            <span className="text-sm text-gray-400">Code: <span className="text-white font-mono">{affiliate.code}</span></span>
          </div>
        </div>
        <div className={`rounded-xl px-4 py-2 ${tc.bg} text-center`}>
          <div className={`text-2xl font-bold ${tc.color}`}>{pct(affiliate.recurringRate)}</div>
          <div className="text-xs text-gray-500">recurring rate</div>
        </div>
      </div>

      {/* Tier progress */}
      {nextTC && (
        <div className="rounded-xl border border-white/8 bg-white/2 p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{tc.emoji} {tc.label}</span>
            <span>{nextTC.emoji} {nextTC.label} — earn {gbp(nextTC.minEarned)} total</span>
          </div>
          <div className="h-2 rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
              initial={{ width: 0 }}
              animate={{ width: `${tierProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {gbp(totalEarned)} earned · {gbp(nextTC.minEarned - totalEarned)} to {nextTC.label} ({pct(nextTC.rate)})
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 flex justify-between">
          {error}
          <button className="underline" onClick={() => setError("")}>dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1 border border-white/6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-max px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === t.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >

          {/* OVERVIEW */}
          {activeTab === "overview" && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total clicks",    value: stats.clicksTotal.toLocaleString(), sub: `${stats.clicks7d} this week` },
                  { label: "Conversions",      value: stats.conversionsTotal.toString(),   sub: `${stats.conversionRate}% rate` },
                  { label: "Total earned",     value: gbp(stats.totalEarnedCents),         sub: "one-time + recurring" },
                  { label: "Recurring earned", value: gbp(stats.recurringCents),           sub: "renewal commissions" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    <div className="text-xs text-indigo-400 mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Clicks — last 30 days</h3>
                  <span className="text-xs text-gray-500">{stats.clicks30d} total</span>
                </div>
                <ClickChart data={clickChart} />
              </div>

              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Tier progress</h3>
                <div className="space-y-2">
                  {TIER_ORDER.map((t) => {
                    const c = TIER_CONFIG[t];
                    const active = t === tier;
                    return (
                      <div key={t} className={`flex items-center justify-between rounded-lg px-3 py-2 ${active ? c.bg : "bg-white/2"}`}>
                        <span className={`text-sm font-medium ${active ? c.color : "text-gray-500"}`}>{c.emoji} {c.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${active ? c.color : "text-gray-600"}`}>{pct(c.rate)} · from {gbp(c.minEarned)}</span>
                          {active && <span className="text-xs text-white bg-indigo-600 px-2 py-0.5 rounded-full">Current</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TOOLS */}
          {activeTab === "tools" && (
            <div className="space-y-4">
              {/* Referral link */}
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white">Your referral link</h3>
                <div className="flex gap-2">
                  <input readOnly value={refLink}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 font-mono" />
                  <button onClick={() => copy(refLink, "link")}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-400 hover:text-white">
                    {copying === "link" ? "✓" : "Copy"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="UTM source tag (optional, e.g. twitter)"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300" />
                </div>
                {utmLink && (
                  <div className="flex gap-2">
                    <input readOnly value={utmLink}
                      className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-3 py-2 text-xs text-indigo-300 font-mono" />
                    <button onClick={() => copy(utmLink, "utm")}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-400 hover:text-white">
                      {copying === "utm" ? "✓" : "Copy"}
                    </button>
                  </div>
                )}
              </div>

              {/* Discount code */}
              {affiliate.couponCode && (
                <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Your discount code</h3>
                  <p className="text-xs text-gray-500 mb-3">Share this code — subscribers get 10% off for 3 months. You still earn commission on every payment.</p>
                  <div className="flex gap-2 items-center">
                    <span className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-4 py-3 font-mono text-lg font-bold text-indigo-300 tracking-widest text-center">
                      {affiliate.couponCode}
                    </span>
                    <button onClick={() => copy(affiliate.couponCode!, "coupon")}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400 hover:text-white">
                      {copying === "coupon" ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {/* QR code */}
              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">QR code</h3>
                {qrLoading ? (
                  <div className="w-32 h-32 rounded-lg bg-white/5 animate-pulse" />
                ) : qrDataUrl ? (
                  <div className="space-y-3">
                    <img src={qrDataUrl} alt="QR code" className="w-32 h-32 rounded-lg border border-white/10" />
                    <a href={qrDataUrl} download={`mm-affiliate-${affiliate.code}.png`}
                      className="inline-block text-xs text-indigo-400 hover:underline">
                      ↓ Download PNG
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Share copy */}
              <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-white">Ready-made copy</h3>
                {[
                  {
                    label: "Twitter / X",
                    text: `I've been using @MansaMusaAI for my business — AI receptionist, CRM, email automation, all in one.\n\nGet started free: ${refLink}`,
                  },
                  {
                    label: "LinkedIn",
                    text: `If you're looking to automate your business with AI, I highly recommend MansaMusaAI.\n\nAI receptionist, automated follow-ups, CRM — it handles it all.\n\nUse my link: ${refLink}`,
                  },
                ].map((c) => (
                  <div key={c.label}>
                    <div className="text-xs text-gray-500 mb-1">{c.label}</div>
                    <div className="flex gap-2">
                      <textarea readOnly value={c.text} rows={3}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 resize-none" />
                      <button onClick={() => copy(c.text, c.label)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400 hover:text-white self-start">
                        {copying === c.label ? "✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile */}
              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Payout details</h3>
                  <button onClick={() => setEditMode(!editMode)} className="text-xs text-indigo-400 hover:underline">
                    {editMode ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editMode ? (
                  <div className="space-y-3">
                    <input value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="PayPal email" type="email"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300" />
                    <input value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)}
                      placeholder="Social handle (optional)"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300" />
                    <button onClick={saveProfile} disabled={savingProfile}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm text-white font-medium disabled:opacity-50">
                      {savingProfile ? "Saving…" : "Save"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">PayPal email</span><span className="text-gray-300">{affiliate.paypalEmail ?? "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Social handle</span><span className="text-gray-300">{affiliate.socialHandle ?? "—"}</span></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Conversions ({conversions.length})</h3>
              {conversions.length === 0 ? (
                <p className="text-gray-500 text-sm">No conversions yet. Share your link to get started.</p>
              ) : conversions.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/8 bg-white/2 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs text-gray-500">{relDate(c.createdAt)}</div>
                    <div className={`text-xs font-medium mt-0.5 ${c.status === "CONVERTED" ? "text-green-400" : "text-gray-400"}`}>
                      {c.status === "CONVERTED" ? "✓ Converted" : "⏳ Signed up"}
                    </div>
                    {c.renewalCount > 0 && <div className="text-xs text-indigo-400 mt-0.5">{c.renewalCount} renewal{c.renewalCount !== 1 ? "s" : ""}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{gbp(c.commissionCents + c.recurringTotal)}</div>
                    <div className="text-xs text-gray-500">{gbp(c.commissionCents)} initial + {gbp(c.recurringTotal)} recurring</div>
                    {c.payoutStatus && (
                      <div className={`text-xs mt-0.5 ${c.payoutStatus === "PAID" ? "text-green-400" : "text-yellow-400"}`}>{c.payoutStatus}</div>
                    )}
                  </div>
                </div>
              ))}

              {renewals.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-white mt-6">Renewal commissions ({renewals.length})</h3>
                  {renewals.map((r) => (
                    <div key={r.id} className="rounded-xl border border-white/8 bg-white/2 px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{relDate(r.paidAt.toString())}</span>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-indigo-400">+{gbp(r.commissionCents)}</div>
                        <div className="text-xs text-gray-600">on {gbp(r.amountCents)} payment</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Top Affiliates</h3>
              {board.length === 0 ? (
                <p className="text-gray-500 text-sm">No affiliates yet.</p>
              ) : board.map((e) => (
                <div key={e.rank} className={`rounded-xl border px-4 py-3 flex items-center gap-4 ${
                  e.isCurrentUser ? "border-indigo-500/40 bg-indigo-500/5" : "border-white/8 bg-white/2"
                }`}>
                  <span className="text-lg font-bold text-gray-500 w-8">#{e.rank}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-mono font-semibold ${e.isCurrentUser ? "text-indigo-300" : "text-gray-300"}`}>
                      {e.maskedCode} {e.isCurrentUser && <span className="text-xs text-indigo-400 ml-1">(you)</span>}
                    </div>
                    <div className="text-xs text-gray-500">{e.conversions} conversions · {e.clicks.toLocaleString()} clicks</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${e.isCurrentUser ? "text-indigo-300" : "text-white"}`}>{gbp(e.totalEarningsCents)}</div>
                    <div className="text-xs text-gray-600">total earned</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAYOUTS */}
          {activeTab === "payouts" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Request payout</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{gbp(stats?.totalEarnedCents ?? 0)}</div>
                    <div className="text-xs text-gray-500">Total earned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-400">{gbp(stats?.recurringCents ?? 0)}</div>
                    <div className="text-xs text-gray-500">Recurring commissions</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">Minimum payout £50 · Processing 3–5 business days</p>
                <div className="space-y-3">
                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">
                    <option value="bank">Bank transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Crypto (USDC)</option>
                  </select>
                  <textarea value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)}
                    placeholder="Notes (account details, wallet address, etc.)" rows={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 resize-none" />
                  <button onClick={requestPayout} disabled={payoutLoading}
                    className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm text-white font-semibold disabled:opacity-50">
                    {payoutLoading ? "Submitting…" : "Request payout"}
                  </button>
                </div>
              </div>

              {payoutRequests.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Payout history</h3>
                  {payoutRequests.map((p) => (
                    <div key={p.id} className="rounded-xl border border-white/8 bg-white/2 px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-gray-500">{relDate(p.createdAt)}</div>
                        <div className="text-xs text-gray-400 mt-0.5 capitalize">{p.method}</div>
                        {p.adminNote && <div className="text-xs text-gray-600 mt-0.5 italic">{p.adminNote}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">{gbp(p.amountCents)}</div>
                        <div className={`text-xs mt-0.5 ${
                          p.status === "PAID" ? "text-green-400" :
                          p.status === "APPROVED" ? "text-indigo-400" :
                          p.status === "REJECTED" ? "text-red-400" : "text-yellow-400"
                        }`}>{p.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
