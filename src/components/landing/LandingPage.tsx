"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import type { PricingPlan } from "@/types";
import CountUp from "@/components/ui/CountUp";
import { fadeUp, scaleIn, stagger, staggerSlow, fadeIn } from "@/lib/motion";

const features = [
  {
    icon: "⚡",
    title: "Streaming responses",
    desc: "See answers generate in real time — no waiting, no page refreshes.",
  },
  {
    icon: "🧠",
    title: "Three AI tiers",
    desc: "Haiku for speed, Sonnet for balance, Opus for deep reasoning.",
  },
  {
    icon: "📜",
    title: "Persistent history",
    desc: "Every conversation saved. Pick up exactly where you left off.",
  },
  {
    icon: "💳",
    title: "Stripe billing",
    desc: "Upgrade or cancel anytime. No lock-in, no surprises.",
  },
  {
    icon: "🛡️",
    title: "Enterprise security",
    desc: "Rate limiting, audit logs, role-based access, and webhook verification.",
  },
  {
    icon: "📱",
    title: "Mobile-first",
    desc: "Fully responsive on every device — from iPhone SE to ultrawide.",
  },
];

const steps = [
  { step: "01", title: "Create your account", desc: "Sign up in 30 seconds. No credit card required to start." },
  { step: "02", title: "Start chatting", desc: "Ask anything. Get streaming AI responses powered by Claude." },
  { step: "03", title: "Scale your plan", desc: "Upgrade when you need more power. Cancel anytime." },
];

interface Props {
  plans: PricingPlan[];
}

export default function LandingPage({ plans }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Navbar ───────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#050508]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-white tracking-tight">
            Mansa<span className="text-brand-400">Musa</span>AI
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/agents" className="text-sm text-gray-400 hover:text-white transition-colors">Agents</Link>
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link>
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setNavOpen(!navOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {navOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={{ height: navOpen ? "auto" : 0, opacity: navOpen ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden md:hidden border-t border-white/10"
        >
          <div className="flex flex-col gap-4 px-6 py-4">
            <Link href="/features" className="text-sm text-gray-400" onClick={() => setNavOpen(false)}>Features</Link>
            <Link href="/agents" className="text-sm text-gray-400" onClick={() => setNavOpen(false)}>Agents</Link>
            <Link href="/pricing" className="text-sm text-gray-400" onClick={() => setNavOpen(false)}>Pricing</Link>
            <Link href="/blog" className="text-sm text-gray-400" onClick={() => setNavOpen(false)}>Blog</Link>
            <Link href="/login" className="text-sm text-gray-400" onClick={() => setNavOpen(false)}>Sign in</Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white text-center"
              onClick={() => setNavOpen(false)}
            >
              Get started free
            </Link>
          </div>
        </motion.div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050508] px-6 pt-20">
        {/* Background orbs */}
        <motion.div
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-[120px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/8 blur-[80px]"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-1/4 left-1/4 h-[250px] w-[250px] rounded-full bg-brand-400/6 blur-[80px]"
          animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto max-w-5xl text-center"
        >
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center gap-6">
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                Powered by Claude AI — Now with Opus 4.8
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              AI as powerful as{" "}
              <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
                Mansa Musa
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={fadeUp}
              className="max-w-2xl text-lg text-gray-400 sm:text-xl"
            >
              The world&apos;s richest man commanded unlimited resources. Now you can too — with an AI operating system built for the next generation of creators, founders, and builders.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group relative rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all duration-200 hover:shadow-brand-500/50 hover:-translate-y-0.5"
              >
                Start for free
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#pricing"
                className="rounded-xl border border-white/10 px-8 py-3.5 text-base font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-colors"
              >
                See pricing
              </a>
            </motion.div>

            {/* Trust line */}
            <motion.p variants={fadeIn} className="text-xs text-gray-600">
              No credit card required · Cancel anytime · GDPR compliant
            </motion.p>
          </motion.div>

          {/* Floating demo card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-16 mx-auto max-w-2xl"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/50 backdrop-blur-sm">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-gray-500">MansaMusaAI — Chat</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-tr-sm bg-brand-500/80 px-4 py-2.5 text-sm text-white">
                    Analyse my Q3 financial performance and suggest improvements
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-sm">
                    AI
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 leading-relaxed">
                    <p className="text-white font-medium mb-1">Q3 Financial Analysis ✦</p>
                    Revenue grew <span className="text-green-400 font-semibold">↑ 23%</span> YoY while operating costs fell <span className="text-green-400 font-semibold">↓ 8%</span>. Your profit margin expanded to <span className="text-brand-400 font-semibold">34.2%</span>.
                    <p className="mt-2 text-gray-500 text-xs">Top recommendation: double down on enterprise tier — it drives 71% of your MRR...</p>
                  </div>
                </div>
                <div className="flex gap-3 items-center ml-11">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex gap-1"
                  >
                    <span className="h-2 w-2 rounded-full bg-brand-400" />
                    <span className="h-2 w-2 rounded-full bg-brand-400" />
                    <span className="h-2 w-2 rounded-full bg-brand-400" />
                  </motion.div>
                  <span className="text-xs text-gray-600">Generating deeper insights…</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {[
              { label: "Platform users", value: 1200, suffix: "+" },
              { label: "Conversations", value: 48000, suffix: "+" },
              { label: "AI messages sent", value: 240000, suffix: "+" },
              { label: "Uptime SLA", value: 99, suffix: ".9%" },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <p className="text-3xl font-extrabold text-gray-900">
                  <CountUp value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-brand-600 uppercase tracking-widest">
              Why MansaMusaAI
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-extrabold text-gray-900">
              Everything you need to build with AI
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From streaming responses to enterprise billing — we handle the infrastructure so you can focus on what matters.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:border-brand-200 hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl group-hover:bg-brand-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-brand-600 uppercase tracking-widest">
              Get started in minutes
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-extrabold text-gray-900">
              Three steps to AI power
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 sm:grid-cols-3"
          >
            {steps.map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[60%] w-full h-px bg-gradient-to-r from-brand-200 to-transparent" />
                )}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-lg shadow-brand-500/30">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold text-brand-600 uppercase tracking-widest">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-extrabold text-gray-900">
              Simple, honest pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-500">
              Start free. Upgrade when you&apos;re ready.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={scaleIn}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-brand-400 bg-brand-500 text-white shadow-xl shadow-brand-500/30"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-600 shadow-sm">
                      Most popular
                    </span>
                  </div>
                )}

                <div className={`text-xs font-semibold uppercase tracking-widest ${plan.highlighted ? "text-brand-100" : "text-brand-600"}`}>
                  {plan.name}
                </div>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.price === 0
                      ? "Free"
                      : new Intl.NumberFormat("en-GB", {
                          style: "currency",
                          currency: plan.currency.toUpperCase(),
                          minimumFractionDigits: 0,
                        }).format(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className={`mb-1 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-400"}`}>/mo</span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-500"}`}>
                  {plan.description}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={plan.highlighted ? "text-brand-100" : "text-brand-500"}>✓</span>
                      <span className={plan.highlighted ? "text-brand-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-white text-brand-600 hover:bg-brand-50"
                      : "border border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {plan.price === 0 ? "Start free" : "Get started"}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#050508] px-6 py-24">
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <div className="h-[400px] w-[600px] rounded-full bg-brand-500/15 blur-[100px]" />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white sm:text-5xl">
            Ready to work with AI?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-400">
            Join thousands of users already building smarter with MansaMusaAI.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all hover:-translate-y-0.5"
            >
              Start for free →
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/10 px-8 py-3.5 text-base font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </motion.div>
          <motion.p variants={fadeIn} className="mt-6 text-xs text-gray-700">
            No credit card required · Free plan forever · Upgrade anytime
          </motion.p>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-gray-900">
            Mansa<span className="text-brand-500">Musa</span>AI
          </span>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} MansaMusaAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
