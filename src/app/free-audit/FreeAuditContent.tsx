"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger } from "@/lib/motion";

const QUESTIONS = [
  {
    id: "industry",
    question: "What industry are you in?",
    options: ["Dental / Healthcare", "Restaurant / Hospitality", "Property / Estate Agency", "Professional Services", "Retail / E-commerce", "Construction / Trades", "Other"],
  },
  {
    id: "size",
    question: "How many people are in your team?",
    options: ["Just me", "2–5", "6–20", "21–50", "50+"],
  },
  {
    id: "pain",
    question: "What's your biggest pain right now?",
    options: ["Missing calls & leads", "Too much admin", "Slow follow-up", "No system for bookings", "High staff costs", "Inconsistent customer experience"],
  },
  {
    id: "spend",
    question: "How much do you currently spend on admin staff per month?",
    options: ["£0 (I do it myself)", "£500–£1,500", "£1,500–£3,000", "£3,000–£6,000", "£6,000+"],
  },
  {
    id: "calls",
    question: "How many inbound calls / enquiries do you get per week?",
    options: ["Under 10", "10–30", "30–60", "60–100", "100+"],
  },
];

const ROI_MAP: Record<string, { timeSaved: string; revGain: string; costSaving: string }> = {
  "Just me":  { timeSaved: "8 hrs/wk", revGain: "£1,200/mo", costSaving: "£600/mo" },
  "2–5":      { timeSaved: "20 hrs/wk", revGain: "£3,500/mo", costSaving: "£1,800/mo" },
  "6–20":     { timeSaved: "45 hrs/wk", revGain: "£8,000/mo", costSaving: "£4,200/mo" },
  "21–50":    { timeSaved: "90 hrs/wk", revGain: "£18,000/mo", costSaving: "£9,500/mo" },
  "50+":      { timeSaved: "180+ hrs/wk", revGain: "£40,000+/mo", costSaving: "£22,000/mo" },
};

export default function FreeAuditContent() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const sizeAnswer = answers["size"] ?? "2–5";
  const roi = ROI_MAP[sizeAnswer] ?? ROI_MAP["2–5"];

  function select(value: string) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (!isLast) {
      setTimeout(() => setStep((s) => s + 1), 250);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message: `Free Audit: ${JSON.stringify(answers)}`, source: "free-audit" }),
    }).catch(() => {});
    await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <MarketingNav />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center mb-10">
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Free tool</motion.p>
            <motion.h1 variants={fadeUp} className="text-4xl font-extrabold text-white">Your Free AI Business Audit</motion.h1>
            <motion.p variants={fadeUp} className="mt-3 text-gray-400">
              90 seconds. Find out exactly what AI can automate in your business and your expected ROI.
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <div className="mb-8 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              animate={{ width: submitted ? "100%" : `${((step + (isLast && answers[current?.id] ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {!submitted && step < QUESTIONS.length && !answers[QUESTIONS[QUESTIONS.length - 1].id] ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-8"
              >
                <p className="text-xs text-gray-500 mb-3">Question {step + 1} of {QUESTIONS.length}</p>
                <h2 className="text-xl font-bold text-white mb-6">{current.question}</h2>
                <div className="grid gap-3">
                  {current.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => select(opt)}
                      className={`w-full rounded-xl border px-5 py-3.5 text-left text-sm font-medium transition-all ${
                        answers[current.id] === opt
                          ? "border-brand-500 bg-brand-500/15 text-brand-300"
                          : "border-white/10 bg-white/4 text-gray-300 hover:border-brand-500/40 hover:bg-white/8"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : !submitted ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* ROI Preview */}
                <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4">Your AI Potential</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Time saved", value: roi.timeSaved, icon: "⏱️" },
                      { label: "Revenue gain", value: roi.revGain, icon: "💰" },
                      { label: "Cost saving", value: roi.costSaving, icon: "📉" },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <div className="text-2xl mb-1">{m.icon}</div>
                        <p className="text-lg font-bold text-white">{m.value}</p>
                        <p className="text-xs text-gray-500">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email capture */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-bold text-white mb-1">Get your full audit report</h3>
                  <p className="text-sm text-gray-400 mb-5">We&apos;ll send you a personalised 5-page report with implementation steps, tools, and a 90-day roadmap.</p>
                  <form onSubmit={submit} className="space-y-3">
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-brand-500/50 focus:outline-none"
                    />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Work email address"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-brand-500/50 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
                    >
                      {loading ? "Sending…" : "Send my free audit report →"}
                    </button>
                    <p className="text-center text-xs text-gray-700">No spam. Unsubscribe anytime.</p>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center"
              >
                <div className="mx-auto mb-4 text-5xl">🎉</div>
                <h2 className="text-2xl font-bold text-white">Your audit is on its way!</h2>
                <p className="mt-2 text-gray-400">Check your inbox in the next few minutes. Meanwhile, start your free trial — no card needed.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/register"
                    className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                  >
                    Start free trial →
                  </Link>
                  <Link
                    href="/pricing"
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-white/20 transition-colors"
                  >
                    View pricing
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
