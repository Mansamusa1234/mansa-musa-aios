"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger } from "@/lib/motion";

const PILLARS = [
  {
    icon: "🔐",
    title: "Encryption at rest & in transit",
    body: "All data is encrypted with AES-256 at rest. Every connection uses TLS 1.3. Your data is never transmitted in plaintext.",
  },
  {
    icon: "🛡️",
    title: "Zero-trust architecture",
    body: "Every API request is authenticated and authorized independently. No implicit trust — even inside our own infrastructure.",
  },
  {
    icon: "🔒",
    title: "SOC 2 Type II-ready",
    body: "Our infrastructure, access controls, and audit logging are aligned with SOC 2 Type II requirements for security, availability, and confidentiality.",
  },
  {
    icon: "🌍",
    title: "GDPR & data residency",
    body: "We process EU data on EU infrastructure (Frankfurt). Full data export and deletion on request. DPA available for enterprise customers.",
  },
  {
    icon: "🧪",
    title: "Penetration testing",
    body: "Regular third-party penetration tests. We run a responsible disclosure programme and patch critical vulnerabilities within 24 hours.",
  },
  {
    icon: "📋",
    title: "Audit logs",
    body: "Immutable audit logs for every action: logins, data access, agent runs, admin changes. Exportable for compliance reporting.",
  },
  {
    icon: "🔑",
    title: "Multi-factor authentication",
    body: "TOTP 2FA built into every account. Enterprise customers can enforce MFA policy across their entire organisation.",
  },
  {
    icon: "🏗️",
    title: "Isolated infrastructure",
    body: "Enterprise customers get dedicated database instances. Your data is never co-mingled with other customers' data.",
  },
];

const PRACTICES = [
  "Annual third-party security audits",
  "Automated dependency vulnerability scanning",
  "Secret scanning on every git commit",
  "Least-privilege IAM across all services",
  "Automated security patching within 48 hours",
  "Private VPC with no public database exposure",
  "Rate limiting and DDoS protection on all APIs",
  "OWASP Top 10 mitigations throughout the codebase",
];

export default function SecurityContent() {
  return (
    <>
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gray-950 py-24 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_60%)]" />
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4">
                Security
              </motion.p>
              <motion.h1 variants={fadeUp} className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Security you can bet{" "}
                <span className="bg-gradient-to-r from-brand-400 to-indigo-300 bg-clip-text text-transparent">
                  your business on
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
                Enterprise-grade protection built into every layer. Your data, your agents, and your customers are protected by industry-leading security practices.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                {["256-bit TLS", "AES-256 at rest", "GDPR compliant", "SOC 2-ready", "Zero trust"].map((badge) => (
                  <span key={badge} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    {badge}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Security pillars */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900">Security by design</h2>
              <p className="mt-3 text-gray-500">Every layer of the platform is built with security as a first principle.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
                >
                  <div className="mb-3 text-2xl">{p.icon}</div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Practices */}
        <section className="py-20 bg-gray-50">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-4">Our practices</p>
                <h2 className="text-3xl font-bold text-gray-900">What we do every day to keep you safe</h2>
                <p className="mt-4 text-gray-500">
                  Security isn&apos;t a one-time checklist. It&apos;s an ongoing commitment woven into our engineering culture, tooling, and processes.
                </p>
              </div>
              <ul className="space-y-3">
                {PRACTICES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <svg className="h-4 w-4 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Responsible disclosure */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900">Responsible disclosure</h2>
              <p className="mt-3 text-gray-500">
                Found a security vulnerability? We take all reports seriously. Contact our security team and we&apos;ll respond within 24 hours.
              </p>
              <a
                href="mailto:security@mansamusaai.com"
                className="mt-6 inline-block rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Report a vulnerability
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-950 py-20 text-white">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold">Ready to deploy with confidence?</h2>
            <p className="mt-4 text-gray-400">Start for free. Enterprise customers get dedicated security reviews and custom DPAs.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Get started free
              </Link>
              <Link
                href="/enterprise"
                className="rounded-xl border border-white/20 px-8 py-3 text-sm font-semibold text-white hover:border-white/40 transition-colors"
              >
                Talk to enterprise
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
