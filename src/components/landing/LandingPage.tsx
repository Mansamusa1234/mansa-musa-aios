"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import type { PricingPlan } from "@/types";
import CountUp from "@/components/ui/CountUp";
import ParticleCanvas from "@/components/ui/ParticleCanvas";
import TypeWriter from "@/components/ui/TypeWriter";
import AgentFeed from "@/components/ui/AgentFeed";
import { fadeUp, scaleIn, stagger, staggerSlow, fadeIn } from "@/lib/motion";

/* ─── Static data ───────────────────────────────────────────── */

const AGENT_PHRASES = [
  "AI Receptionist",
  "Sales Agent",
  "Lead Qualifier",
  "Booking Agent",
  "Support Agent",
  "Follow-up Agent",
  "All AI Employees",
];

const LIVE_METRICS = [
  { label: "Calls answered 24/7",  value: 100, suffix: "%",   prefix: "",  color: "text-brand-400"   },
  { label: "Leads captured",       value: 3,   suffix: "x",   prefix: "",  color: "text-green-400"   },
  { label: "Languages supported",  value: 30,  suffix: "+",   prefix: "",  color: "text-blue-400"    },
  { label: "Starter plan",         value: 49,  suffix: "/mo", prefix: "£", color: "text-purple-400"  },
  { label: "Setup time (minutes)", value: 2,   suffix: "",    prefix: "",  color: "text-amber-400"   },
  { label: "Uptime SLA",           value: 99,  suffix: ".9%", prefix: "",  color: "text-emerald-400" },
];

const AGENTS = [
  { icon: "📞", name: "AI Receptionist",  role: "Answers calls 24/7"          },
  { icon: "💼", name: "Sales Agent",      role: "Pipeline & Lead Nurturing"   },
  { icon: "🎯", name: "Lead Qualifier",   role: "Scores & Routes Hot Leads"   },
  { icon: "📅", name: "Booking Agent",    role: "Appointments & Scheduling"   },
  { icon: "🎧", name: "Support Agent",    role: "Customer Success"            },
  { icon: "📩", name: "Follow-up Agent",  role: "SMS & Email Sequences"       },
  { icon: "📣", name: "Marketing Agent",  role: "Campaigns & SEO"             },
  { icon: "🔬", name: "Research Agent",   role: "Market Intelligence"         },
  { icon: "💰", name: "Finance Agent",    role: "P&L, Forecasting, Tax"       },
  { icon: "🔒", name: "Security Agent",   role: "Audits & Protection"         },
];

const FEATURES = [
  { icon: "📞", title: "Answers every call",    desc: "Your AI receptionist picks up in under 2 seconds — 24/7, 365, zero hold music."      },
  { icon: "🎯", title: "Scores every lead",     desc: "Asks qualifying questions, ranks prospects, routes hot leads to your team instantly." },
  { icon: "📅", title: "Books appointments",    desc: "Syncs with your calendar and confirms bookings without any back-and-forth."           },
  { icon: "💬", title: "WhatsApp integration",  desc: "AI-powered WhatsApp inbox. Every inbound message gets an instant reply."             },
  { icon: "🤝", title: "Affiliate programme",   desc: "Earn 20% recurring commission for every business you refer. No cap."                 },
  { icon: "📧", title: "Email automation",      desc: "Trigger-based sequences fire automatically on lead capture, bookings, and more."      },
];

const WISDOM_FEATURES = [
  {
    icon: "⚔️",
    title: "AI Competition System",
    desc: "24 specialist agents compete on any business question. An AI judge scores every response 0–100. Winner's output saved permanently.",
    href: "/compete",
    cta: "Run a competition",
  },
  {
    icon: "💎",
    title: "Wisdom Vault",
    desc: "Every winning answer preserved, searchable, and rateable. The world's first AI wisdom library — built by competition, not curation.",
    href: "/wisdom",
    cta: "Explore the Vault",
  },
  {
    icon: "🏟️",
    title: "Wisdom Arena",
    desc: "Six AI agents debate your hardest business decisions. They critique each other's logic and synthesise a scored consensus answer.",
    href: "/wisdom-arena",
    cta: "See how it works",
  },
];

const STEPS = [
  { step: "01", title: "Sign up free",           desc: "30 seconds. No credit card. Start your 14-day trial instantly." },
  { step: "02", title: "Configure your AI",      desc: "Name it, give it your business info, set your hours. Under 2 minutes." },
  { step: "03", title: "Go live",                desc: "Embed on your site or connect your phone number. Your AI is on call." },
];

/* ─── Component ─────────────────────────────────────────────── */

interface Props { plans: PricingPlan[] }

export default function LandingPage({ plans }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030308] font-sans">

      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 z-50 w-full border-b border-white/8 bg-[#030308]/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Mansa<span className="text-brand-400">Musa</span>AI
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {[
              ["AI Receptionist", "/ai-receptionist"],
              ["Agents",          "/agents"         ],
              ["Pricing",         "/pricing"        ],
              ["Affiliate",       "/affiliate"      ],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
            ))}
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25">
              Get started free
            </Link>
          </div>

          <button className="md:hidden text-gray-400 hover:text-white p-1" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {navOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        <motion.div
          initial={false}
          animate={{ height: navOpen ? "auto" : 0, opacity: navOpen ? 1 : 0 }}
          transition={{ duration: 0.22 }}
          className="overflow-hidden md:hidden border-t border-white/8"
        >
          <div className="flex flex-col gap-4 px-6 py-5">
            {[["AI Receptionist","/ai-receptionist"],["Agents","/agents"],["Pricing","/pricing"],["Affiliate","/affiliate"],["Sign in","/login"]].map(([l,h]) => (
              <Link key={l} href={h} className="text-sm text-gray-400" onClick={() => setNavOpen(false)}>{l}</Link>
            ))}
            <Link href="/register" className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white text-center" onClick={() => setNavOpen(false)}>
              Get started free
            </Link>
          </div>
        </motion.div>
      </motion.nav>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* Particle network */}
        <ParticleCanvas count={60} rgb="212,132,26" maxDist={135} />

        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(212,132,26,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,132,26,0.03) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orbs */}
        <motion.div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-brand-500/8 blur-[140px]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="pointer-events-none absolute top-1/3 right-1/4 h-[320px] w-[320px] rounded-full bg-purple-600/6 blur-[100px]"
          animate={{ scale: [1, 1.25, 1], x: [0, 35, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div className="pointer-events-none absolute bottom-1/4 left-1/4 h-[260px] w-[260px] rounded-full bg-blue-500/5 blur-[80px]"
          animate={{ scale: [1, 1.35, 1], y: [0, -25, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />

        {/* Main content */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto w-full max-w-6xl">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center gap-5">

            {/* Live badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                Powered by Claude AI — Now with Opus 4.8
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.08]">
              AI as powerful as{" "}
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-amber-200 bg-clip-text text-transparent">
                Mansa Musa
              </span>
            </motion.h1>

            {/* Typewriter subtitle */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 text-xl sm:text-2xl text-gray-300 font-medium">
              <span>Deploy your</span>
              <TypeWriter
                phrases={AGENT_PHRASES}
                className="text-brand-400 font-bold min-w-[180px] text-left"
                cursorClassName="bg-brand-400"
              />
            </motion.div>

            {/* Sub-text */}
            <motion.p variants={fadeUp} className="max-w-2xl text-base text-gray-500 sm:text-lg leading-relaxed">
              The world&apos;s richest man commanded unlimited resources. Now you can too —
              a complete AI Operating System that runs every department of your business.
              Sales. Finance. HR. Legal. Marketing. Operations. All in one platform.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="group relative rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all duration-200 hover:shadow-brand-500/50 hover:-translate-y-0.5">
                Start for free
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/pricing" className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-gray-300 hover:border-white/20 hover:bg-white/8 hover:text-white transition-all backdrop-blur-sm">
                See pricing
              </Link>
            </motion.div>

            <motion.p variants={fadeIn} className="text-xs text-gray-700">
              No credit card required · Cancel anytime · GDPR compliant
            </motion.p>
          </motion.div>

          {/* ── 2-panel demo ─────────────────────────────────── */}
          <div className="mt-14 grid gap-4 lg:grid-cols-2 max-w-4xl mx-auto">

            {/* Chat mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl shadow-black/60 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-gray-500">MansaMusaAI — Finance Agent</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-xs rounded-2xl rounded-tr-sm bg-brand-500/75 px-4 py-2.5 text-sm text-white backdrop-blur-sm">
                    Analyse my Q3 financial performance and suggest improvements
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-sm border border-brand-500/30">
                    💰
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-gray-300 leading-relaxed">
                    <p className="text-white font-semibold mb-1">Q3 Financial Analysis ✦</p>
                    Revenue grew <span className="text-green-400 font-semibold">↑ 23%</span> YoY while operating costs fell{" "}
                    <span className="text-green-400 font-semibold">↓ 8%</span>. Profit margin expanded to{" "}
                    <span className="text-brand-300 font-semibold">34.2%</span>.
                    <p className="mt-2 text-gray-500 text-xs">Top recommendation: double down on enterprise tier — it drives 71% of MRR...</p>
                  </div>
                </div>
                <div className="flex gap-3 items-center ml-11">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex gap-1"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                  </motion.div>
                  <span className="text-xs text-gray-600">Generating deeper insights…</span>
                </div>
              </div>
            </motion.div>

            {/* Agent activity feed */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-2xl border border-white/10 bg-white/4 p-4 shadow-2xl shadow-black/60 backdrop-blur-md"
            >
              <AgentFeed maxItems={5} />
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom fade into metrics */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#06060e] to-transparent pointer-events-none" />
      </section>

      {/* ══ LIVE METRICS ══════════════════════════════════════════ */}
      <section className="bg-[#06060e] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
              · Live Platform Data ·
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold text-white sm:text-4xl">
              Real numbers, running in real time
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            {LIVE_METRICS.map((m) => (
              <motion.div
                key={m.label}
                variants={scaleIn}
                whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-5 text-center backdrop-blur-sm hover:border-brand-500/30 hover:bg-white/6 transition-colors"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl bg-brand-500/5" />
                <p className={`relative text-2xl font-extrabold sm:text-3xl ${m.color}`}>
                  <CountUp value={m.value} prefix={m.prefix} suffix={m.suffix} duration={1600} />
                </p>
                <p className="relative mt-1.5 text-xs text-gray-500 leading-tight">{m.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ AGENTS SHOWCASE ═══════════════════════════════════════ */}
      <section className="bg-[#030308] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">· Your AI Workforce ·</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white sm:text-5xl">
              10 specialist agents,{" "}
              <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">
                one platform
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-gray-500 max-w-xl mx-auto">
              Each agent is purpose-built, trained on domain knowledge, and ready to deploy.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {AGENTS.map((a) => (
              <motion.div
                key={a.name}
                variants={scaleIn}
                whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-white/8 bg-white/4 p-5 text-center backdrop-blur-sm hover:border-brand-500/30 hover:bg-white/6 transition-colors cursor-default"
              >
                <div className="mb-3 text-3xl">{a.icon}</div>
                <p className="text-sm font-semibold text-white">{a.name}</p>
                <p className="mt-1 text-xs text-gray-500">{a.role}</p>
                {/* Status dot */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10 text-center">
            <Link href="/agents" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-brand-500/40 hover:text-white transition-all backdrop-blur-sm">
              Explore all agents <span>→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ EVERY DEPARTMENT ════════════════════════════════════ */}
      <section className="bg-[#030308] px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Full Business OS</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              One platform. Every department.<br className="hidden sm:block" /> Zero gaps.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              Most businesses stitch together 12 different tools to run one company. MansaMusaAI replaces all of them — a single AI Operating System for every function, every team, every workflow.
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                dept: "Sales & Revenue",
                icon: "💰",
                color: "border-green-500/20 hover:border-green-500/40",
                accent: "text-green-400",
                agents: ["Lead Qualifier", "Sales Agent", "Follow-up Agent", "Proposal Writer", "Deal Closer"],
                desc: "Never miss a lead. AI qualifies, nurtures, and closes — 24/7.",
              },
              {
                dept: "Customer Support",
                icon: "🎧",
                color: "border-blue-500/20 hover:border-blue-500/40",
                accent: "text-blue-400",
                agents: ["Support Agent", "AI Receptionist", "Complaint Handler", "Escalation Router", "Feedback Collector"],
                desc: "Every customer gets an instant, accurate, on-brand response.",
              },
              {
                dept: "Marketing",
                icon: "📣",
                color: "border-purple-500/20 hover:border-purple-500/40",
                accent: "text-purple-400",
                agents: ["Content Writer", "SEO Agent", "Social Media Agent", "Email Campaign Agent", "Brand Voice Agent"],
                desc: "Campaigns, content, and copy — generated and published automatically.",
              },
              {
                dept: "Finance & Accounting",
                icon: "📊",
                color: "border-amber-500/20 hover:border-amber-500/40",
                accent: "text-amber-400",
                agents: ["Finance Agent", "Invoice Agent", "P&L Analyst", "Tax Prep Agent", "Forecasting Agent"],
                desc: "Real-time financials, forecasts, and reports without a CFO.",
              },
              {
                dept: "HR & People",
                icon: "👥",
                color: "border-pink-500/20 hover:border-pink-500/40",
                accent: "text-pink-400",
                agents: ["Hiring Agent", "Onboarding Agent", "Policy Agent", "Performance Agent", "Culture Agent"],
                desc: "Hire, onboard, and manage your team — AI handles the process.",
              },
              {
                dept: "Legal & Compliance",
                icon: "⚖️",
                color: "border-red-500/20 hover:border-red-500/40",
                accent: "text-red-400",
                agents: ["Contract Reviewer", "Compliance Agent", "GDPR Agent", "Risk Assessor", "Legal Researcher"],
                desc: "Contracts reviewed, risks flagged, compliance maintained automatically.",
              },
              {
                dept: "Operations",
                icon: "⚙️",
                color: "border-cyan-500/20 hover:border-cyan-500/40",
                accent: "text-cyan-400",
                agents: ["Workflow Agent", "Scheduling Agent", "Supplier Agent", "Inventory Agent", "Process Agent"],
                desc: "Every operational workflow automated — nothing falls through the cracks.",
              },
              {
                dept: "Research & Intelligence",
                icon: "🔬",
                color: "border-indigo-500/20 hover:border-indigo-500/40",
                accent: "text-indigo-400",
                agents: ["Research Agent", "Competitor Agent", "Market Agent", "Data Analyst", "Insight Agent"],
                desc: "Competitive intelligence and market research delivered daily.",
              },
              {
                dept: "Executive & Strategy",
                icon: "👑",
                color: "border-brand-500/20 hover:border-brand-500/40",
                accent: "text-brand-400",
                agents: ["Strategy Agent", "Board Report Agent", "OKR Tracker", "Decision Agent", "Wisdom Arena"],
                desc: "AI advisors that think at board level — for every major decision.",
              },
            ].map((d) => (
              <motion.div
                key={d.dept}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className={`rounded-2xl border bg-white/3 p-6 transition-colors ${d.color}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{d.icon}</span>
                  <h3 className={`font-bold text-base ${d.accent}`}>{d.dept}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{d.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.agents.map((a) => (
                    <span key={a} className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-xs text-gray-500">{a}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 rounded-2xl border border-brand-500/20 bg-brand-500/5 px-8 py-8 text-center">
            <p className="text-2xl font-bold text-white mb-2">9 departments. 41 specialist agents. 1 subscription.</p>
            <p className="text-gray-500 mb-6">No per-seat pricing. No department silos. The entire business runs on one platform.</p>
            <Link href="/agents" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
              See all 41 agents →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════ */}
      <section className="bg-[#06060e] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">· Platform ·</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white sm:text-5xl">
              Everything you need to build with AI
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-gray-500 max-w-2xl mx-auto">
              From streaming responses to enterprise billing — we handle the infrastructure so you focus on results.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ y: -5, transition: { duration: 0.18 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm hover:border-brand-500/30 transition-colors"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-brand-500/6 to-transparent rounded-2xl" />
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-2xl group-hover:border-brand-500/30 transition-colors">
                  {f.icon}
                </div>
                <h3 className="relative font-semibold text-white">{f.title}</h3>
                <p className="relative mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ AGENTS GROW ══════════════════════════════════════════ */}
      <section className="bg-[#04040c] px-6 py-24 border-t border-white/5 overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Living AI · Not Static Software</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Your agents don&apos;t stay the<br className="hidden sm:block" /> same. They grow.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
              Like a new employee who learns your business on day one and becomes your best performer by year one — MansaMusaAI agents get sharper with every call, every win, every answer saved.
            </motion.p>
          </motion.div>

          {/* Growth timeline */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                stage: "Day 1",
                icon: "🌱",
                color: "from-green-900/40 to-green-900/10 border-green-800/30",
                accent: "text-green-400",
                title: "First breath",
                desc: "Learns your business name, tone, products, and FAQs. Ready to answer calls from the moment you go live.",
              },
              {
                stage: "Week 1",
                icon: "📈",
                color: "from-blue-900/40 to-blue-900/10 border-blue-800/30",
                accent: "text-blue-400",
                title: "Pattern recognition",
                desc: "Spots your most common questions, your best-converting responses, and your customers' biggest objections.",
              },
              {
                stage: "Month 1",
                icon: "🧠",
                color: "from-purple-900/40 to-purple-900/10 border-purple-800/30",
                accent: "text-purple-400",
                title: "Deep expertise",
                desc: "Handles complex enquiries, qualifies leads with precision, and routes the right customers to the right outcome every time.",
              },
              {
                stage: "Year 1",
                icon: "👑",
                color: "from-amber-900/40 to-amber-900/10 border-amber-800/30",
                accent: "text-amber-400",
                title: "Your best employee",
                desc: "A fully trained AI workforce that knows your business inside out — never calls in sick, never forgets, never stops improving.",
              },
            ].map((s) => (
              <motion.div
                key={s.stage}
                variants={fadeUp}
                className={`relative rounded-2xl border bg-gradient-to-b ${s.color} p-6`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest ${s.accent} mb-3`}>{s.stage}</p>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom pull quote */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-14 rounded-2xl border border-brand-500/20 bg-brand-500/5 px-8 py-8 text-center"
          >
            <p className="text-xl sm:text-2xl font-semibold text-white leading-snug">
              &ldquo;Most software is frozen the day you buy it.<br className="hidden sm:block" />
              MansaMusaAI agents are alive — they compound.&rdquo;
            </p>
            <p className="mt-3 text-sm text-gray-500">Every saved answer, every won competition, every customer interaction makes them smarter.</p>
          </motion.div>
        </div>
      </section>

      {/* ══ WHO IS THIS FOR ══════════════════════════════════════ */}
      <section className="bg-[#06060e] px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Who This Is For</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Built for businesses that<br className="hidden sm:block" /> refuse to stay small
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              If you run a business and you&apos;re doing the work of five people — this was built for you.
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🏗️", who: "Founders & Solopreneurs",       pain: "Wearing every hat in the business",               fix: "Your AI team handles calls, admin, follow-ups and marketing so you focus on growth." },
              { icon: "🏥", who: "Clinics & Healthcare",           pain: "Missing calls, losing bookings, slow follow-up",   fix: "AI receptionist books appointments 24/7, sends reminders, handles enquiries instantly." },
              { icon: "🔧", who: "Trades & Service Businesses",    pain: "Can't answer calls on the job",                   fix: "Your AI picks up every call, qualifies the job, books it in — while you're on site." },
              { icon: "🏠", who: "Estate Agents & Property",       pain: "Leads going cold before you call back",           fix: "AI qualifies every enquiry, books viewings, and follows up until they convert." },
              { icon: "⚖️", who: "Law Firms & Accountants",        pain: "Admin eating into billable time",                 fix: "AI handles intake, scheduling, document queries and client follow-up automatically." },
              { icon: "🛍️", who: "Retail & E-Commerce",            pain: "Support tickets piling up overnight",             fix: "AI support agent resolves queries 24/7, handles returns, and upsells on autopilot." },
              { icon: "🚀", who: "Startups & Scale-ups",           pain: "Can't afford to hire full departments yet",       fix: "Deploy a full team of specialist AI agents for less than one junior hire." },
              { icon: "🌍", who: "Global & Remote Businesses",     pain: "Different time zones, different languages",       fix: "AI agents work in 30+ languages, across every time zone, around the clock." },
              { icon: "🏢", who: "SMEs Ready to Scale",            pain: "Growth is limited by operational capacity",      fix: "Remove every operational bottleneck with AI that scales instantly with demand." },
            ].map((item) => (
              <motion.div
                key={item.who}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className="rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-brand-500/30 transition-colors"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-white mb-1">{item.who}</h3>
                <p className="text-xs text-red-400 mb-3">❌ {item.pain}</p>
                <p className="text-sm text-gray-400 leading-relaxed">✅ {item.fix}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 text-center">
            <p className="text-gray-500 mb-6 text-lg">Starting from <span className="text-white font-bold">£49/month</span> — less than one hour of an employee&apos;s time.</p>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-semibold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all hover:-translate-y-0.5">
              Start free — no card needed →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ WISDOM ECONOMY ═══════════════════════════════════════ */}
      <section className="bg-[#06060e] px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">· NEW · The Wisdom Economy ·</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white">
              AI agents that compete for the right answer
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-gray-500 max-w-2xl mx-auto">
              Run competitions between 24 specialist agents. The winner&apos;s output is preserved forever as a Wisdom Asset — searchable, rateable, yours.
            </motion.p>
          </motion.div>

          <motion.div variants={staggerSlow} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-5 sm:grid-cols-3">
            {WISDOM_FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 backdrop-blur-sm hover:border-indigo-500/30 transition-colors"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-indigo-500/6 to-transparent" />
                <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-2xl group-hover:border-indigo-500/30 transition-colors">
                  {f.icon}
                </div>
                <h3 className="relative font-semibold text-white">{f.title}</h3>
                <p className="relative mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                <Link href={f.href} className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  {f.cta} →
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <Link
              href="/wisdom-arena"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-3 text-sm font-semibold text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-500/15 transition-all"
            >
              🏟️ Explore the Wisdom Arena →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section className="bg-[#030308] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">· Get started ·</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white">
              Up and running in three steps
            </motion.h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-7 left-[60%] w-full h-px bg-gradient-to-r from-brand-500/40 to-transparent" />
                )}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white shadow-lg shadow-brand-500/30">
                  {s.step}
                </div>
                <h3 className="font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════════ */}
      <section id="pricing" className="bg-[#06060e] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">· Pricing ·</motion.p>
            <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white">Simple, honest pricing</motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-gray-500">Start free. Upgrade when you&apos;re ready.</motion.p>
          </motion.div>

          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={scaleIn}
                whileHover={{ y: -6, transition: { duration: 0.18 } }}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.highlighted
                    ? "border-brand-400 bg-brand-500 shadow-xl shadow-brand-500/30"
                    : "border-white/10 bg-white/4 backdrop-blur-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-600 shadow">Most popular</span>
                  </div>
                )}

                <div className={`text-xs font-bold uppercase tracking-widest ${plan.highlighted ? "text-brand-100" : "text-brand-400"}`}>
                  {plan.name}
                </div>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-white"}`}>
                    {plan.price === 0
                      ? "Free"
                      : new Intl.NumberFormat("en-GB", { style: "currency", currency: plan.currency.toUpperCase(), minimumFractionDigits: 0 }).format(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className={`mb-1 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-500"}`}>/mo</span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-500"}`}>{plan.description}</p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={plan.highlighted ? "text-brand-100" : "text-brand-400"}>✓</span>
                      <span className={plan.highlighted ? "text-brand-50" : "text-gray-400"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-white text-brand-600 hover:bg-brand-50"
                      : "border border-white/10 text-gray-300 hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-white"
                  }`}
                >
                  {plan.price === 0 ? "Start free" : "Get started"}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#030308] px-6 py-28">
        {/* Particle canvas in CTA too */}
        <ParticleCanvas count={30} rgb="212,132,26" maxDist={100} />

        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 7, repeat: Infinity }}
        >
          <div className="h-[450px] w-[700px] rounded-full bg-brand-500/12 blur-[120px]" />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
            </span>
            41 agents ready to deploy
          </motion.div>

          <motion.h2 variants={fadeUp} className="text-5xl font-extrabold text-white sm:text-6xl">
            Your AI workforce
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">
              starts today
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-400">
            Join thousands of founders and operators already building smarter with MansaMusaAI.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all hover:-translate-y-0.5 hover:shadow-brand-500/50">
              Start for free →
            </Link>
            <Link href="/agents" className="rounded-xl border border-white/10 bg-white/4 px-8 py-4 text-base font-semibold text-gray-300 hover:border-white/20 hover:bg-white/8 hover:text-white transition-all backdrop-blur-sm">
              Explore agents
            </Link>
          </motion.div>
          <motion.p variants={fadeIn} className="mt-6 text-xs text-gray-700">
            No credit card required · Free plan forever · Cancel anytime
          </motion.p>
        </motion.div>
      </section>

      {/* ══ COMMUNITY ═════════════════════════════════════════════ */}
      <section className="px-6 py-20 bg-[#0a0a14]">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Community</motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Join 1,000+ businesses<br className="hidden sm:block" /> building with AI
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg mb-8">
            Get early access to new agents, share wins, ask questions, and connect with founders using MansaMusaAI to scale their business.
          </motion.p>
          <motion.a
            variants={scaleIn}
            href="https://discord.gg/VCQ25nfGd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-[#5865F2] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#5865F2]/30 hover:bg-[#4752C4] transition-all hover:-translate-y-0.5"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Join our Discord community
          </motion.a>
          <motion.p variants={fadeIn} className="mt-4 text-xs text-gray-600">Free to join · No spam · Active founders & builders</motion.p>
        </motion.div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="border-t border-white/8 bg-[#030308] px-6 py-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-white">
            Mansa<span className="text-brand-400">Musa</span>AI
          </span>
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <Link href="/ai-receptionist" className="hover:text-gray-300 transition-colors">AI Receptionist</Link>
            <Link href="/agents"          className="hover:text-gray-300 transition-colors">Agents</Link>
            <Link href="/affiliate"       className="hover:text-gray-300 transition-colors">Affiliate</Link>
            <Link href="/pricing"         className="hover:text-gray-300 transition-colors">Pricing</Link>
            <Link href="/blog"            className="hover:text-gray-300 transition-colors">Blog</Link>
            <Link href="/login"           className="hover:text-gray-300 transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-gray-700">© {new Date().getFullYear()} MansaMusaAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
