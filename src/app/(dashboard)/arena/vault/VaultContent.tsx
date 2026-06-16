"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

interface Memory {
  id: string;
  sessionId: string;
  question: string;
  summary: string;
  savedAt: Date;
}

export default function VaultContent({ memories }: { memories: Memory[] }) {
  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Knowledge Vault ·</p>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Your saved wisdom</h1>
            <p className="mt-1 text-sm text-gray-500">Deep Wisdom Answers you've saved from past debates.</p>
          </div>
          <Link href="/arena" className="flex-shrink-0 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            + New Debate
          </Link>
        </motion.div>
      </motion.div>

      {memories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">📚</div>
          <p className="text-gray-400 font-medium">Your vault is empty.</p>
          <p className="mt-1 text-sm text-gray-600">Run a Wisdom Arena debate and save the answer to build your collection.</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
          {memories.map((m) => (
            <motion.div key={m.id} variants={scaleIn}>
              <Link
                href={`/arena?session=${m.sessionId}`}
                className="block rounded-xl border border-white/8 bg-white/3 p-4 hover:border-brand-500/25 hover:bg-white/5 transition-colors"
              >
                <p className="text-sm font-bold text-white">{m.question}</p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{m.summary}</p>
                <p className="mt-2 text-[10px] text-gray-600">Saved {new Date(m.savedAt).toLocaleDateString()}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
