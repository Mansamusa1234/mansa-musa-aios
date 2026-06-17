"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

interface Props {
  items: CheckItem[];
  onDismiss: () => void;
}

export default function OnboardingChecklist({ items, onDismiss }: Props) {
  const [open, setOpen] = useState(true);
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-white">Get started — {pct}% complete</p>
          <p className="text-xs text-gray-500 mt-0.5">Complete these steps to get the most out of MansaMusaAI.</p>
        </div>
        <button onClick={() => { setOpen(false); onDismiss(); }} className="text-xs text-gray-600 hover:text-gray-400">Dismiss</button>
      </div>
      <div className="mb-4 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full bg-brand-500" />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${item.done ? "border-green-500/20 bg-green-500/5" : "border-white/6 bg-white/3"}`}>
            <div className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 ${item.done ? "border-green-500 bg-green-500" : "border-gray-600"}`}>
              {item.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.done ? "text-gray-500 line-through" : "text-white"}`}>{item.label}</p>
              <p className="text-xs text-gray-600 truncate">{item.description}</p>
            </div>
            {!item.done && (
              <Link href={item.href} className="flex-shrink-0 rounded-lg border border-brand-500/30 px-3 py-1 text-xs font-semibold text-brand-400 hover:bg-brand-500/10 transition-colors">
                {item.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
