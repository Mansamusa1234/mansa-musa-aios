"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

interface ReferralRow {
  id: string;
  name: string | null;
  email: string;
  joinedAt: Date;
  status: string;
  rewardCents: number;
}

interface Props {
  code: string;
  referrals: ReferralRow[];
  totalRewardCents: number;
  convertedCount: number;
}

export default function ReferralsContent({ code, referrals, totalRewardCents, convertedCount }: Props) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${code}` : `/register?ref=${code}`;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Referrals ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Invite friends, earn rewards</h1>
          <p className="mt-1 text-sm text-gray-500">
            Share your link — when someone signs up and subscribes, you earn a reward.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "People referred", value: referrals.length, prefix: "" },
            { label: "Converted to paid", value: convertedCount, prefix: "" },
            { label: "Rewards earned", value: totalRewardCents / 100, prefix: "£" },
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

        {/* Referral link */}
        <motion.div variants={fadeUp} className="mt-5 rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-sm font-bold text-white mb-2">Your referral link</p>
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
            Rewards are tracked automatically here — payout details are handled by the MansaMusaAI team.
          </p>
        </motion.div>
      </motion.div>

      {/* Referral list */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">People you've referred</h2>
        {referrals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">🔗</div>
            <p className="text-gray-400 font-medium">No referrals yet.</p>
            <p className="mt-1 text-sm text-gray-600">Share your link above to start earning rewards.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-sm font-bold text-brand-300">
                    {(r.name ?? r.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{r.name ?? r.email}</p>
                    <p className="text-xs text-gray-600">Joined {new Date(r.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    r.status === "CONVERTED" ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"
                  }`}>
                    {r.status === "CONVERTED" ? "Converted" : "Signed up"}
                  </span>
                  {r.rewardCents > 0 && (
                    <p className="mt-1 text-xs font-bold text-brand-400">£{(r.rewardCents / 100).toFixed(2)}</p>
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
