"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger, staggerSlow, scaleIn } from "@/lib/motion";

const sections = [
  {
    badge: "01 · Core AI",
    title: "Real-Time Streaming AI",
    description: "Watch answers generate token-by-token. Our streaming engine delivers instant, fluid responses — no waiting, no spinners, no page refreshes.",
    bullets: [
      "Token streaming via Server-Sent Events",
      "Up to 200K context window per conversation",
      "Automatic reconnection on network drop",
      "Keyboard shortcuts for power users",
    ],
    mockup: (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
        <div className="flex gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">U</div>
          <div className="flex-1 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">Summarise the key risks in this Q3 report</div>
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">AI</div>
          <div className="flex-1">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-sm text-gray-800 leading-relaxed">
              Here are the <span className="font-semibold">top 3 risks</span> I identified:<br />
              <span className="text-brand-600 font-medium">1.</span> Supply chain exposure in APAC region<br />
              <span className="text-brand-600 font-medium">2.</span> FX volatility on USD-denominated contracts
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block ml-1 h-4 w-0.5 bg-brand-500 align-middle" />
            </div>
          </div>
        </div>
      </div>
    ),
    flip: false,
  },
  {
    badge: "02 · Models",
    title: "Three AI Tiers. One Platform.",
    description: "Route each task to the right model automatically. Speed when you need it, depth when it matters, and raw intelligence for your hardest problems.",
    bullets: [
      "Claude Haiku — fastest responses, great for quick tasks",
      "Claude Sonnet — balanced intelligence for daily work",
      "Claude Opus 4.8 — deepest reasoning for complex analysis",
      "Automatic model routing by subscription plan",
    ],
    mockup: (
      <div className="space-y-3">
        {[
          { name: "Claude Haiku", label: "Free · Basic", speed: "Fastest", color: "bg-gray-100 text-gray-700", bar: "w-1/3" },
          { name: "Claude Sonnet", label: "Pro", speed: "Balanced", color: "bg-brand-100 text-brand-700", bar: "w-2/3" },
          { name: "Claude Opus 4.8", label: "Enterprise", speed: "Deepest", color: "bg-amber-100 text-amber-700", bar: "w-full" },
        ].map((m) => (
          <div key={m.name} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm text-gray-900">{m.name}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.color}`}>{m.label}</span>
              </div>
              <span className="text-xs text-gray-400">{m.speed}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div className={`h-1.5 rounded-full bg-brand-400 ${m.bar}`} />
            </div>
          </div>
        ))}
      </div>
    ),
    flip: true,
  },
  {
    badge: "03 · Agents",
    title: "AI Agent Hub",
    description: "Deploy specialised AI agents across every business function. Each agent has domain knowledge, memory, and tools for their specific area.",
    bullets: [
      "10 pre-built agents covering every department",
      "CEO, Finance, Legal, Dev, Marketing and more",
      "Domain-specific knowledge and context",
      "Available from Basic plan and above",
    ],
    mockup: (
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "👑", name: "CEO", color: "from-yellow-400 to-amber-500" },
          { icon: "💰", name: "Finance", color: "from-green-400 to-emerald-500" },
          { icon: "⚖️", name: "Legal", color: "from-purple-400 to-violet-500" },
          { icon: "⚡", name: "Developer", color: "from-indigo-400 to-blue-500" },
          { icon: "📣", name: "Marketing", color: "from-pink-400 to-rose-500" },
          { icon: "🔒", name: "Security", color: "from-red-400 to-rose-500" },
        ].map((a) => (
          <div key={a.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-sm`}>{a.icon}</div>
            <span className="text-sm font-medium text-gray-700">{a.name}</span>
          </div>
        ))}
      </div>
    ),
    flip: false,
  },
  {
    badge: "04 · Security",
    title: "Bank-Grade Security",
    description: "Built security-first with rate limiting, audit logs, role-based access, webhook verification, and input sanitisation at every layer.",
    bullets: [
      "Upstash Redis rate limiting on every endpoint",
      "Role-based access control (USER / ADMIN)",
      "Stripe webhook signature verification",
      "Audit logs for all sensitive operations",
    ],
    mockup: (
      <div className="space-y-2.5">
        {[
          { icon: "🛡️", label: "Rate limiting", detail: "30 req/min per user", ok: true },
          { icon: "🔑", label: "Auth protection", detail: "JWT + secure cookies", ok: true },
          { icon: "✅", label: "Webhook verification", detail: "Stripe HMAC signed", ok: true },
          { icon: "📋", label: "Audit logging", detail: "All admin actions", ok: true },
          { icon: "🚫", label: "SQL injection", detail: "Prisma ORM protection", ok: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.detail}</p>
              </div>
            </div>
            <span className="text-green-500 font-bold text-sm">✓</span>
          </div>
        ))}
      </div>
    ),
    flip: true,
  },
];

const capabilities = [
  { icon: "📱", title: "Mobile-First", desc: "Full PWA support, bottom nav, touch-optimised UI." },
  { icon: "💳", title: "Stripe Billing", desc: "Subscriptions, invoices, webhooks, customer portal." },
  { icon: "📊", title: "Analytics", desc: "Token usage, message counts, MRR, admin command centre." },
  { icon: "🌍", title: "Global CDN", desc: "Vercel Edge Network — sub-50ms responses worldwide." },
  { icon: "♾️", title: "Infinite History", desc: "Every conversation persisted. Search and resume anytime." },
  { icon: "⚙️", title: "Admin Dashboard", desc: "Full command centre for user, revenue, and system management." },
];

export default function FeaturesContent() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="px-6 py-20 text-center bg-gradient-to-b from-brand-50/50 to-white">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-3xl">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-600">Platform Features</motion.p>
          <motion.h1 variants={fadeUp} className="mt-3 text-5xl font-extrabold tracking-tight text-gray-900">
            Everything your business needs
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-xl text-gray-500">
            Streaming AI, multi-model intelligence, agent hub, enterprise billing, and bank-grade security — built into one platform.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex justify-center gap-4">
            <Link href="/register" className="rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-colors">
              Get started free
            </Link>
            <Link href="/pricing" className="rounded-xl border border-gray-200 px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              See pricing
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature sections */}
      {sections.map((s, i) => (
        <section key={s.badge} className={`px-6 py-20 ${i % 2 === 1 ? "bg-gray-50" : "bg-white"}`}>
          <div className="mx-auto max-w-6xl">
            <div className={`flex flex-col gap-16 lg:flex-row lg:items-center ${s.flip ? "lg:flex-row-reverse" : ""}`}>
              <motion.div
                initial={{ opacity: 0, x: s.flip ? 24 : -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex-1 space-y-6"
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">{s.badge}</p>
                <h2 className="text-4xl font-extrabold text-gray-900">{s.title}</h2>
                <p className="text-lg text-gray-500">{s.description}</p>
                <ul className="space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: s.flip ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1"
              >
                {s.mockup}
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* Capability grid */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center text-3xl font-bold text-gray-900">
            And much more
          </motion.h2>
          <motion.div variants={staggerSlow} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <motion.div key={c.title} variants={scaleIn} whileHover={{ y: -3, transition: { duration: 0.15 } }} className="rounded-2xl border border-gray-100 p-6 hover:border-brand-200 hover:shadow-sm transition-all">
                <div className="mb-3 text-3xl">{c.icon}</div>
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500">{c.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
