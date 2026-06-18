"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger } from "@/lib/motion";

const FEATURES = [
  { icon: "🏢", title: "Dedicated infrastructure", body: "Your own isolated database, compute, and storage. No noisy neighbours. Guaranteed uptime SLA." },
  { icon: "🔑", title: "Single Sign-On (SSO)", body: "Connect your existing identity provider — Okta, Azure AD, Google Workspace. Enforce MFA policy across all users." },
  { icon: "🤖", title: "Custom AI agents", body: "Build bespoke agents trained on your internal knowledge, processes, and brand voice. Private model fine-tuning available." },
  { icon: "📊", title: "Advanced analytics", body: "Full usage analytics, cost attribution per team, agent performance dashboards, and custom reporting via API." },
  { icon: "⚙️", title: "Role-based access control", body: "Fine-grained permissions for every team and resource. Audit logs for every action. Compliance-ready from day one." },
  { icon: "🛡️", title: "Enterprise security", body: "SOC 2 Type II-ready, GDPR DPA, custom data residency, penetration test reports on request." },
  { icon: "💬", title: "Dedicated success team", body: "Named customer success manager, priority Slack channel, quarterly business reviews, and onboarding assistance." },
  { icon: "💰", title: "Volume pricing", body: "Significant discounts for larger teams. Annual billing options. Custom commercial terms for large deployments." },
];

const LOGOS = ["Fortune 500", "Series B+", "SMB 500+", "Government", "Healthcare", "Legal"];

export default function EnterpriseContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, company, size, message: `Enterprise enquiry — ${size} employees. ${message}`, subject: "Enterprise Enquiry" }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <>
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gray-950 py-24 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_60%)]" />
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <motion.div variants={stagger} initial="hidden" animate="visible">
                <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4">Enterprise</motion.p>
                <motion.h1 variants={fadeUp} className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                  AI at scale for your{" "}
                  <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
                    entire organisation
                  </span>
                </motion.h1>
                <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-400">
                  Dedicated infrastructure, custom agents, SSO, compliance controls, and a team that treats your success as their job.
                </motion.p>
                <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                  <a href="#contact" className="rounded-xl bg-brand-600 px-7 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
                    Talk to sales
                  </a>
                  <Link href="/security" className="rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:border-white/40 transition-colors">
                    Security overview
                  </Link>
                </motion.div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-4"
              >
                {["99.99% uptime SLA", "Custom data residency", "SOC 2 Type II-ready", "Dedicated CSM", "Volume discounts", "Custom AI agents"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <svg className="h-4 w-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-b border-gray-100 bg-white py-8">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Trusted across industries</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {LOGOS.map((l) => (
                <span key={l} className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">{l}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900">Everything your enterprise needs</h2>
              <p className="mt-3 text-gray-500">From compliance to custom agents — we&apos;ve built it so your team can move fast.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
                >
                  <div className="mb-3 text-2xl">{f.icon}</div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact form */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="mx-auto max-w-2xl px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Talk to sales</h2>
              <p className="mt-3 text-gray-500">Tell us about your organisation and we&apos;ll get back to you within one business day.</p>
            </div>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
                <h3 className="text-lg font-semibold text-gray-900">We&apos;ll be in touch</h3>
                <p className="mt-2 text-sm text-gray-500">Expect to hear from us within one business day.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ent-name" className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
                    <input id="ent-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label htmlFor="ent-email" className="mb-1.5 block text-sm font-medium text-gray-700">Work email</label>
                    <input id="ent-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                      placeholder="jane@company.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="ent-company" className="mb-1.5 block text-sm font-medium text-gray-700">Company</label>
                  <input id="ent-company" type="text" required autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Acme Corp" />
                </div>
                <div>
                  <label htmlFor="ent-size" className="mb-1.5 block text-sm font-medium text-gray-700">Team size</label>
                  <select id="ent-size" value={size} onChange={(e) => setSize(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Select team size</option>
                    <option>10–50</option>
                    <option>51–200</option>
                    <option>201–1000</option>
                    <option>1000+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ent-message" className="mb-1.5 block text-sm font-medium text-gray-700">How can we help?</label>
                  <textarea id="ent-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Tell us about your use case and what you need from an enterprise AI platform…"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Sending…" : "Send enquiry"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
