"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

interface Conversion {
  id: string;
  status: string;
  commissionCents: number;
  createdAt: Date;
  payoutStatus: string | null;
}

const PAYOUT_STYLES: Record<string, string> = {
  PENDING: "bg-gray-500/15 text-gray-400",
  APPROVED: "bg-blue-500/15 text-blue-300",
  PAID: "bg-green-500/15 text-green-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

const PAYOUT_LABELS: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  PAID: "Paid",
  REJECTED: "Rejected",
};

interface AffiliateInfo {
  code: string;
  clicks: number;
  commissionRate: number;
}

interface Props {
  affiliate: AffiliateInfo | null;
  conversions: Conversion[];
  totalCommissionCents: number;
}

export default function AffiliateContent({ affiliate, conversions, totalCommissionCents }: Props) {
  const [applying, setApplying] = useState(false);
  const [code, setCode] = useState(affiliate?.code ?? null);
  const [copied, setCopied] = useState(false);

  async function apply() {
    setApplying(true);
    try {
      const res = await fetch("/api/affiliate/apply", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCode(data.code);
      }
    } finally {
      setApplying(false);
    }
  }

  const link = code ? (typeof window !== "undefined" ? `${window.location.origin}/go/${code}` : `/go/${code}`) : "";

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!affiliate && !code) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Affiliate Programme ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Earn commission promoting MansaMusaAI</h1>
          <p className="mt-1 text-sm text-gray-500">
            Get a trackable link, share it with your audience, and earn a commission on every subscription it drives.
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">🤝</div>
          <p className="text-gray-300 font-medium mb-1">You're not an affiliate yet</p>
          <p className="text-sm text-gray-600 mb-5">Join in one click — no application review, start sharing right away.</p>
          <button
            onClick={apply}
            disabled={applying}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {applying ? "Joining…" : "Become an affiliate"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Affiliate Programme ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Your affiliate dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            You earn {affiliate?.commissionRate ?? 20}% commission on every subscription your link drives.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Link clicks",        value: affiliate?.clicks ?? 0, prefix: "" },
            { label: "Conversions",        value: conversions.filter((c) => c.status === "CONVERTED").length, prefix: "" },
            { label: "Commission earned",  value: totalCommissionCents / 100, prefix: "£" },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
              <p className="text-xl font-extrabold text-brand-400">
                {s.prefix}
                <CountUp value={s.value} />
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Affiliate link */}
        <motion.div variants={fadeUp} className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-sm font-bold text-white mb-2">Your trackable link</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={link}
              className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-gray-300 outline-none"
            />
            <button
              onClick={copyLink}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-600">
            Commission is tracked automatically, then reviewed and paid out manually by the MansaMusaAI team — nothing is paid automatically.
          </p>
        </motion.div>
      </motion.div>

      {/* Conversions list */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">Activity</h2>
        {conversions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">📈</div>
            <p className="text-gray-400 font-medium">No signups yet.</p>
            <p className="mt-1 text-sm text-gray-600">Share your link above to start earning commission.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Referred signup</p>
                  <p className="text-xs text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.status === "CONVERTED" ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"
                  }`}>
                    {c.status === "CONVERTED" ? "Converted" : "Signed up"}
                  </span>
                  {c.commissionCents > 0 && (
                    <p className="mt-1 text-xs font-bold text-brand-400">£{(c.commissionCents / 100).toFixed(2)}</p>
                  )}
                  {c.payoutStatus && (
                    <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${PAYOUT_STYLES[c.payoutStatus] ?? PAYOUT_STYLES.PENDING}`}>
                      {PAYOUT_LABELS[c.payoutStatus] ?? c.payoutStatus}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
