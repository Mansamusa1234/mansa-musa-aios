"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  plan: string;
  limit: number;
  used: number;
  feature?: string;
}

export default function UpgradePrompt({ plan, limit, used, feature }: Props) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const nearLimit = pct >= 80;
  const atLimit = used >= limit;

  if (!nearLimit) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 mb-4 ${atLimit ? "border-red-500/30 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${atLimit ? "text-red-400" : "text-amber-300"}`}>
            {atLimit ? `${feature ?? "Message"} limit reached` : `Approaching your ${plan} limit`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {used.toLocaleString()} / {limit.toLocaleString()} messages used this month
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-white/8 overflow-hidden max-w-48">
            <div className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link
          href="/billing"
          className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${atLimit ? "bg-red-500 text-white hover:bg-red-600" : "bg-amber-500 text-white hover:bg-amber-600"}`}
        >
          Upgrade
        </Link>
      </div>
    </motion.div>
  );
}
