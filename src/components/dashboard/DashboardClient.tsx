"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import CountUp from "@/components/ui/CountUp";
import PushNotificationToggle from "@/components/ui/PushNotificationToggle";
import OnboardingChecklist from "@/components/ui/OnboardingChecklist";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";
import { AGENTS } from "@/data/agents";

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  _count: { messages: number };
}

interface OnboardingItem {
  id: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

interface Props {
  userName: string;
  conversations: Conversation[];
  plan: string;
  status: string;
  totalConversations: number;
  onboardingItems?: OnboardingItem[];
  onboardingComplete?: boolean;
  msgUsed?: number;
  msgLimit?: number | null;
}

const QUICK_LINKS = [
  { icon: "🤖", label: "AI Marketplace",    href: "/marketplace",     desc: `Browse ${AGENTS.length} agents` },
  { icon: "📊", label: "Agent Dashboard",   href: "/agent-dashboard", desc: "Manage deployments"   },
  { icon: "📰", label: "News Feed",         href: "/news",            desc: "Live intelligence"    },
  { icon: "📈", label: "Analytics",         href: "/analytics",       desc: "Usage & insights"     },
];

export default function DashboardClient({ userName, conversations, plan, status, totalConversations, onboardingItems, onboardingComplete, msgUsed = 0, msgLimit }: Props) {
  const isActive = status === "active" || status === "ACTIVE";
  const [showOnboarding, setShowOnboarding] = useState(!onboardingComplete && (onboardingItems?.some((i) => !i.done) ?? false));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Dashboard ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Your AI workforce is ready.</p>
        </motion.div>

        {/* Onboarding checklist */}
        {showOnboarding && onboardingItems && (
          <motion.div variants={fadeUp} className="mt-4">
            <OnboardingChecklist items={onboardingItems} onDismiss={() => setShowOnboarding(false)} />
          </motion.div>
        )}

        {/* Usage limit warning */}
        {msgLimit && (
          <motion.div variants={fadeUp} className="mt-2">
            <UpgradePrompt plan={plan} limit={msgLimit} used={msgUsed} feature="Message" />
          </motion.div>
        )}

        {/* Stats */}
        <motion.div variants={stagger} className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Conversations", value: totalConversations, isNum: true,  icon: "💬", color: "text-brand-400" },
            { label: "Current plan",  value: plan,               isNum: false, icon: "✦",  color: "text-green-400" },
            { label: "Status",        value: isActive ? "Active" : (status || "Free"),
                                                                  isNum: false, icon: "◉",  color: isActive ? "text-green-400" : "text-gray-400" },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={scaleIn}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="rounded-2xl border border-white/8 bg-white/3 p-5 hover:border-brand-500/25 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">{s.label}</p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`mt-2 text-2xl font-extrabold capitalize ${s.color}`}>
                {s.isNum ? <CountUp value={s.value as number} duration={1200} /> : s.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick links */}
        <motion.div variants={fadeUp} className="mt-6">
          <h2 className="text-sm font-bold text-white mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="flex flex-col rounded-xl border border-white/8 bg-white/3 p-4 hover:border-brand-500/25 hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl mb-2">{q.icon}</span>
                <p className="text-xs font-semibold text-white">{q.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{q.desc}</p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Push notifications */}
        <motion.div variants={fadeUp} className="mt-6">
          <PushNotificationToggle />
        </motion.div>

        {/* Recent conversations */}
        <motion.div variants={fadeUp} className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Conversations</h2>
            <Link href="/chat" className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors">
              New chat →
            </Link>
          </div>

          {conversations.length === 0 ? (
            <motion.div
              variants={scaleIn}
              className="rounded-2xl border border-dashed border-white/10 p-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-3xl">
                💬
              </div>
              <p className="text-gray-400 font-medium">No conversations yet.</p>
              <p className="mt-1 text-sm text-gray-600">Start your first AI conversation now.</p>
              <Link
                href="/chat"
                className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                Start your first chat
              </Link>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="space-y-2">
              {conversations.map((c, i) => (
                <motion.div
                  key={c.id}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                >
                  <Link
                    href={`/chat?id=${c.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-4 hover:border-brand-500/25 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-sm font-bold text-brand-300">
                        {c.title[0]?.toUpperCase() ?? "C"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{c.title}</p>
                        <p className="text-xs text-gray-600">
                          {c._count.messages} messages · {new Date(c.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-600 text-sm flex-shrink-0">→</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
