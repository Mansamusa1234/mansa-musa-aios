"use client";

import { motion } from "framer-motion";

interface Props {
  annual: boolean;
  onChange: (v: boolean) => void;
}

export default function AnnualToggle({ annual, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(false)}
        className={`text-sm font-semibold transition-colors ${!annual ? "text-white" : "text-gray-500"}`}
      >
        Monthly
      </button>

      <button
        onClick={() => onChange(!annual)}
        className="relative h-7 w-12 rounded-full bg-white/10 border border-white/20 transition-colors hover:bg-white/15"
        aria-label="Toggle annual billing"
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 h-6 w-6 rounded-full shadow-sm ${annual ? "bg-brand-400 right-0.5" : "bg-gray-400 left-0.5"}`}
        />
      </button>

      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-2 text-sm font-semibold transition-colors ${annual ? "text-white" : "text-gray-500"}`}
      >
        Annual
        <span className="rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-bold text-green-400">
          Save 20%
        </span>
      </button>
    </div>
  );
}
