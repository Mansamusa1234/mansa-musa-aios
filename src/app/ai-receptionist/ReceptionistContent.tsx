"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger } from "@/lib/motion";

// What the receptionist does today: website chat only (phone, SMS and WhatsApp are not offered).
const CAPABILITIES = [
  { icon: "💬", title: "Answers website chat", body: "Replies to visitors on your website chat with the name, greeting and persona you choose." },
  { icon: "🎯", title: "Captures leads", body: "When a visitor leaves their name and email, it is saved as a new lead in your CRM." },
  { icon: "🧠", title: "Knows your business", body: "Tell it what your business does, your hours and your tone, and it answers in that style." },
  { icon: "📊", title: "Conversation history", body: "Chats are saved so you can review what visitors asked." },
  { icon: "🎨", title: "Matches your brand", body: "Choose the widget colour, name and greeting so it fits your website." },
  { icon: "📅", title: "Works with your booking calendar", body: "Your booking calendar lets clients book appointments into your availability." },
];

const STEPS = [
  { number: "01", title: "Name it", body: "Choose a name, greeting and persona for your receptionist." },
  { number: "02", title: "Describe your business", body: "Add what you do and your opening hours so it can answer questions." },
  { number: "03", title: "Add it to your website", body: "Put the chat on your site. New enquiries appear in your CRM." },
];

const USE_CASES = [
  { emoji: "🦷", name: "Dentists", desc: "Answer treatment and opening-hours questions on your website and capture new-patient enquiries." },
  { emoji: "🍽️", name: "Restaurants", desc: "Answer menu and booking questions on your website while staff look after guests." },
  { emoji: "🏗️", name: "Scaffolding companies", desc: "Capture job enquiries from your website while your crew is on site." },
  { emoji: "📊", name: "Accountants", desc: "Answer common questions and capture new-client enquiries without interrupting your team." },
  { emoji: "🏡", name: "Estate agents", desc: "Capture buyer and renter enquiries from your website, whatever the time." },
  { emoji: "🚗", name: "Car dealerships", desc: "Capture test drive and part-exchange enquiries from your website." },
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
                Your AI receptionist answers enquiries on your website chat, captures leads into your CRM, and works alongside your booking calendar.
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
                Join free with no card. The receptionist is included from Starter (£49/month).
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
                { stat: "14 days", label: "free Professional trial" },
                { stat: "No card", label: "to start free" },
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
              <p className="mt-3 text-gray-500">Your AI receptionist handles enquiries on your website chat.</p>
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
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
            <h2 className="text-3xl font-bold">Your website visitors have questions right now.</h2>
            <p className="mt-4 text-brand-100">Set up your website chat AI receptionist today and capture every enquiry in your CRM.</p>
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
