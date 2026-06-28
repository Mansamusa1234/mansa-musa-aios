"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger } from "@/lib/motion";

const faqs = [
  { q: "How quickly do you respond?", a: "We aim to respond to all enquiries within 24 hours on business days." },
  { q: "Do you offer enterprise contracts?", a: "Yes — custom SLAs, invoicing, and dedicated onboarding are available on Enterprise plans." },
  { q: "Can I get a demo?", a: "Absolutely. Use the form to request a live demo and we'll arrange a call." },
  { q: "Do you have a reseller programme?", a: "We're building an affiliate and reseller programme. Express your interest via the contact form." },
];

export default function ContactContent() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-gray-50 px-6 py-20">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-3xl text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-600">Contact</motion.p>
          <motion.h1 variants={fadeUp} className="mt-3 text-5xl font-extrabold tracking-tight text-gray-900">
            We&apos;d love to hear from you
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-xl text-gray-500">
            Questions about pricing, enterprise plans, partnerships, or just want to say hello — we&apos;re here.
          </motion.p>
        </motion.div>
      </section>

      {/* Form + info */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-16 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

            {status === "sent" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-green-100 bg-green-50 py-16 text-center"
              >
                <div className="text-5xl">✅</div>
                <h3 className="text-xl font-bold text-gray-900">Message received!</h3>
                <p className="text-gray-500 max-w-sm">We typically respond within 24 hours on business days.</p>
                <button onClick={() => setStatus("idle")} className="mt-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
                  Send another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name <span className="text-red-400">*</span></label>
                    <input
                      type="text" required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-400">*</span></label>
                    <input
                      type="email" required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@company.com"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Enterprise plan enquiry"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message <span className="text-red-400">*</span></label>
                  <textarea
                    required minLength={20} rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors resize-none"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-500">Something went wrong. Please try again or email us directly.</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-xl bg-brand-500 py-3.5 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors shadow-sm shadow-brand-500/20"
                >
                  {status === "sending" ? "Sending…" : "Send message →"}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-8"
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact information</h2>
              <div className="space-y-3">
                {[
                  { icon: "✉️", label: "Email", value: "ai@mansamusainitiative.com" },
                  { icon: "⏰", label: "Response time", value: "Within 24 hours" },
                  { icon: "🌍", label: "Based in", value: "United Kingdom" },
                  { icon: "💼", label: "Enterprise", value: "sales@mansamusainitiative.com" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3.5">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-400">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Common questions</h3>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <details key={faq.q} className="group rounded-xl border border-gray-100 overflow-hidden">
                    <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors list-none">
                      {faq.q}
                      <span className="text-brand-500 group-open:rotate-45 transition-transform duration-200">+</span>
                    </summary>
                    <div className="border-t border-gray-100 px-4 py-3">
                      <p className="text-sm text-gray-500">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
