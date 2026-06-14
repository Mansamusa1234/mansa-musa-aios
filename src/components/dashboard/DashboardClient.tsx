"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CountUp from "@/components/ui/CountUp";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  _count: { messages: number };
}

interface Props {
  userName: string;
  conversations: Conversation[];
  plan: string;
  status: string;
  totalConversations: number;
}

export default function DashboardClient({ userName, conversations, plan, status, totalConversations }: Props) {
  const stats = [
    { label: "Conversations", value: totalConversations, isNum: true, icon: "💬" },
    { label: "Current plan", value: plan, isNum: false, icon: "✦" },
    { label: "Status", value: status, isNum: false, icon: "◉" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">Here&apos;s what&apos;s happening with your account.</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={scaleIn}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:border-brand-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{s.label}</p>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 capitalize">
                {s.isNum ? (
                  <CountUp value={s.value as number} duration={1200} />
                ) : (
                  s.value
                )}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent conversations */}
        <motion.div variants={fadeUp} className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent conversations</h2>
            <Link href="/chat" className="text-sm font-medium text-brand-600 hover:underline">
              New chat →
            </Link>
          </div>

          {conversations.length === 0 ? (
            <motion.div
              variants={scaleIn}
              className="rounded-2xl border border-dashed border-gray-200 p-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">
                💬
              </div>
              <p className="text-gray-500 font-medium">No conversations yet.</p>
              <p className="mt-1 text-sm text-gray-400">Start your first AI conversation now.</p>
              <Link
                href="/chat"
                className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
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
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                >
                  <Link
                    href={`/chat?id=${c.id}`}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-600">
                        {c.title[0]?.toUpperCase() ?? "C"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{c.title}</p>
                        <p className="text-xs text-gray-400">
                          {c._count.messages} messages · {new Date(c.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-300 text-sm">→</span>
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
