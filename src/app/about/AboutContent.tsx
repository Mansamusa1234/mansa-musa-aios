"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger, staggerSlow, scaleIn } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

const values = [
  { icon: "⚡", title: "Speed as a value", desc: "We ship fast, iterate daily, and believe that done-today beats perfect-someday. Every feature you see was built with urgency." },
  { icon: "🔒", title: "Security by default", desc: "Every line of code is written with security in mind. Rate limiting, audit logs, and input validation are not afterthoughts — they're defaults." },
  { icon: "🌍", title: "Accessible intelligence", desc: "The most powerful AI shouldn't require a £1M budget. Our free plan and transparent pricing mean any business can benefit from AI." },
  { icon: "🤝", title: "Radical transparency", desc: "Clear pricing, honest limitations, and direct communication. We don't hide fees, downplay risks, or overpromise capabilities." },
];

const timeline = [
  { year: "2024", title: "Idea born", desc: "A vision for an AI operating system that could run entire businesses — not just answer questions." },
  { year: "2025 Q1", title: "First build", desc: "Prototype built with Claude API. Streaming chat, multi-model routing, and subscription billing working end-to-end." },
  { year: "2025 Q3", title: "Agent Hub", desc: "10 specialised AI agents deployed. CEO, Finance, Legal, Marketing, Security — each with domain expertise." },
  { year: "2026", title: "Scale", desc: "Thousands of users. Fintech-grade infrastructure. Full marketing platform. The AI OS vision becomes reality." },
];

export default function AboutContent() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050508] to-gray-900 px-6 py-28 text-center">
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-brand-500/15 blur-[100px]" />
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 mx-auto max-w-4xl">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-400">Our Mission</motion.p>
          <motion.h1 variants={fadeUp} className="mt-4 text-5xl font-extrabold text-white sm:text-6xl">
            Democratising{" "}
            <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
              enterprise AI
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
            We believe every business deserves access to world-class AI — not just Fortune 500 companies with seven-figure AI budgets. MansaMusaAI changes that.
          </motion.p>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-center"
          >
            {[
              { label: "Users worldwide",    value: 1200, suffix: "+" },
              { label: "AI agents deployed", value: 10,   suffix: "" },
              { label: "Conversations",      value: 48000, suffix: "+" },
              { label: "Uptime",             value: 99,   suffix: ".9%" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp}>
                <p className="text-4xl font-extrabold text-gray-900">
                  <CountUp value={s.value} suffix={s.suffix} duration={1400} />
                </p>
                <p className="mt-1.5 text-sm text-gray-500">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Our story</h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-brand-100 hidden sm:block" />
            <div className="space-y-10">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 sm:pl-12 relative"
                >
                  <div className="hidden sm:flex absolute left-0 top-1 h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white shadow-md shadow-brand-500/25">
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-600">{item.year}</span>
                    <h3 className="mt-1 text-lg font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-gray-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What we stand for</h2>
          </motion.div>
          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {values.map((v) => (
              <motion.div
                key={v.title}
                variants={scaleIn}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className="flex gap-5 rounded-2xl border border-gray-100 p-6 hover:border-brand-200 hover:shadow-sm transition-all"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">{v.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900">{v.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-500 px-6 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-white">Join the mission</h2>
        <p className="mt-3 text-brand-100 max-w-xl mx-auto">We're building the AI operating system the world deserves. Start for free and be part of the story.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-600 hover:bg-brand-50 shadow-lg transition-colors">
            Start for free
          </Link>
          <Link href="/contact" className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors">
            Get in touch
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
