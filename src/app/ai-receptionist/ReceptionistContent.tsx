"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger } from "@/lib/motion";

const CAPABILITIES = [
  { icon: "📞", title: "Answers calls 24/7", body: "Never miss a caller again. Your AI receptionist picks up instantly — no hold music, no voicemail." },
  { icon: "🎯", title: "Qualifies leads", body: "Asks the right questions, scores prospects, and routes hot leads to your sales team immediately." },
  { icon: "📅", title: "Books appointments", body: "Connects to your calendar. Confirms availability and books meetings without any back-and-forth." },
  { icon: "📩", title: "Handles email & SMS", body: "Works across every channel — phone, email, SMS, and web chat — with a single unified setup." },
  { icon: "🧠", title: "Learns your business", body: "Train it on your FAQs, pricing, services, and policies. It answers like your best employee would." },
  { icon: "🌐", title: "Speaks 30+ languages", body: "Serves customers in their native language — automatically, without any extra setup." },
  { icon: "📊", title: "Full conversation logs", body: "Every call and message transcribed and stored. Review, search, and export anytime." },
  { icon: "🔌", title: "Integrates with your CRM", body: "Pushes leads and notes directly into Salesforce, HubSpot, Pipedrive, and 200+ other tools." },
];

const STEPS = [
  { number: "01", title: "Connect your number", body: "Port your existing number or get a new one. Takes under 2 minutes." },
  { number: "02", title: "Train on your business", body: "Upload FAQs, pricing, policies. The AI is ready to answer questions about your business." },
  { number: "03", title: "Set your routing rules", body: "Decide when to escalate to a human, who to alert, and how to follow up." },
  { number: "04", title: "Go live", body: "Publish with one click. Your AI receptionist is live across all channels instantly." },
];

const USE_CASES = [
  { emoji: "🦷", name: "Dentists", desc: "Book appointments, handle cancellations, and answer treatment queries 24/7 — without tying up your receptionist." },
  { emoji: "🍽️", name: "Restaurants", desc: "Take table reservations, answer menu questions, and handle large-party enquiries automatically." },
  { emoji: "🏗️", name: "Scaffolding companies", desc: "Capture job enquiries, schedule site surveys, and qualify leads while your crew is on site." },
  { emoji: "📊", name: "Accountants", desc: "Handle client intake calls, book consultations, and answer deadline FAQs without interrupting your team." },
  { emoji: "🏡", name: "Estate agents", desc: "Qualify buyers and renters, book viewings, and answer property queries around the clock." },
  { emoji: "🚗", name: "Car dealerships", desc: "Handle test drive bookings, part-exchange enquiries, and finance questions instantly." },
];

export default function ReceptionistContent() {
  return (
    <>
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gray-950 py-24 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.2),transparent_60%)]" />
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4">AI Receptionist</motion.p>
              <motion.h1 variants={fadeUp} className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Never miss a lead{" "}
                <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
                  again
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
                Your AI receptionist answers calls, qualifies leads, books appointments, and handles FAQs — 24 hours a day, 7 days a week, in 30+ languages.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register" className="rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
                  Deploy in 2 minutes
                </Link>
                <Link href="/contact" className="rounded-xl border border-white/20 px-8 py-3 text-sm font-semibold text-white hover:border-white/40 transition-colors">
                  Book a demo
                </Link>
              </motion.div>
              <motion.p variants={fadeUp} className="mt-4 text-xs text-gray-500">
                Free plan includes 100 calls/month. No credit card required.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Social proof strip */}
        <section className="border-b border-gray-100 bg-white py-8">
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              {[
                { stat: "£49/mo", label: "starts from" },
                { stat: "24/7", label: "always on" },
                { stat: "30+", label: "languages supported" },
                { stat: "< 2s", label: "average answer time" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold text-gray-900">{s.stat}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900">One AI. Every channel. All day.</h2>
              <p className="mt-3 text-gray-500">Your AI receptionist handles every customer touchpoint — automatically.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map((c) => (
                <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
                >
                  <div className="mb-3 text-2xl">{c.icon}</div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{c.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-gray-950 text-white">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold">Set up in 4 steps</h2>
              <p className="mt-3 text-gray-400">No code. No developers. No waiting.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <motion.div key={s.number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <span className="text-5xl font-extrabold text-white/10">{s.number}</span>
                  <h3 className="mt-2 text-base font-semibold text-white">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900">Built for your industry</h2>
              <p className="mt-3 text-gray-500">From a single-chair dentist to a 20-branch estate agency.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((u) => (
                <motion.div key={u.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}
                  className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5"
                >
                  <span className="text-2xl shrink-0">{u.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{u.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-brand-600 to-indigo-700 py-20 text-white">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold">Your phone is ringing right now.</h2>
            <p className="mt-4 text-brand-100">Deploy your AI receptionist today and never let another lead go to voicemail.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register"
                className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
              >
                Start free — then from £49/mo
              </Link>
              <Link href="/contact"
                className="rounded-xl border border-white/40 px-8 py-3 text-sm font-semibold text-white hover:border-white transition-colors"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
