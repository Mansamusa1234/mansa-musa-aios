"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const STATS = [
  { value: "24", label: "Specialist AI agents" },
  { value: "8",  label: "Wisdom categories" },
  { value: "6",  label: "AI model providers" },
  { value: "£0", label: "To get started" },
];

const FEATURES = [
  {
    icon: "⚔️",
    title: "AI Competition System",
    desc: "Pit 24 specialist agents against each other on any business question. An AI judge scores every response 0–100. The winner's output becomes a permanent Wisdom Asset.",
    href: "/register",
    cta: "Run your first competition",
  },
  {
    icon: "💎",
    title: "Wisdom Vault",
    desc: "Every winning answer is preserved, rated, and searchable. The world's first AI wisdom library — built by competition, not curation.",
    href: "/register",
    cta: "Explore the Vault",
  },
  {
    icon: "🏟️",
    title: "Wisdom Arena (Multi-Agent Debate)",
    desc: "Six AI agents debate your hardest business decisions. They critique each other's logic, then synthesise a scored consensus answer.",
    href: "/wisdom-arena",
    cta: "See how it works",
  },
  {
    icon: "🤖",
    title: "AI Workforce OS",
    desc: "Receptionist, CRM, Support, Calendar, Analytics — a full AI workforce. No hiring. No salary. No sick days.",
    href: "/features",
    cta: "See all modules",
  },
  {
    icon: "🔐",
    title: "Fintech-grade security",
    desc: "TOTP 2FA, HMAC session tokens, HIBP breach detection, rate limiting, HTTP security headers. Enterprise-ready on day one.",
    href: "/register",
    cta: "Start secure",
  },
  {
    icon: "📡",
    title: "6 AI providers, one platform",
    desc: "Claude, OpenAI, Gemini, Grok, Mistral, OpenRouter. Switch models per conversation. Your data never trains third-party models.",
    href: "/pricing",
    cta: "Compare plans",
  },
];

const TIMELINE = [
  { step: "01", title: "Create your free account", desc: "No credit card required. Takes 30 seconds." },
  { step: "02", title: "Pick an AI agent or run a competition", desc: "Choose from 24 specialists or pit them all against each other." },
  { step: "03", title: "Get wisdom. Build faster.", desc: "Winning outputs saved to your Wisdom Vault forever." },
];

export default function LaunchContent() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-white to-white" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Live now — open to the public
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            The World&apos;s First<br />
            <span className="text-brand-600">AI Wisdom Economy</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-500 leading-relaxed">
            24 specialist AI agents compete on your business questions. Winning outputs become permanent, searchable Wisdom Assets. Start free — no card needed.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5"
            >
              Start free — no card needed →
            </Link>
            <Link
              href="/wisdom-arena"
              className="rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-all"
            >
              See Wisdom Arena
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
              <p className="text-3xl font-extrabold text-brand-600">{s.value}</p>
              <p className="mt-1 text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">What you get</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Everything in one platform</h2>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group rounded-2xl border border-gray-200 bg-white p-6 hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                <Link
                  href={f.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2 transition-all"
                >
                  {f.cta} →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Get started in 3 steps</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Simple to start, powerful at scale</h2>
          </motion.div>
          <div className="space-y-8">
            {TIMELINE.map((t, i) => (
              <motion.div
                key={t.step}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100">
                  <span className="text-sm font-extrabold text-brand-600">{t.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-gray-900 px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="text-4xl font-extrabold text-white">Start free. Stay free as long as you want.</h2>
          <p className="mt-4 text-gray-400">Upgrade to Basic (£19/mo), Pro (£49/mo), or Enterprise (£199/mo) when you&apos;re ready.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25"
            >
              Start free today →
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white hover:border-white/40 transition-all"
            >
              Compare all plans
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">No credit card required · Cancel anytime · 7-day money-back guarantee</p>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
}
