"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger } from "@/lib/motion";

const PILLARS = [
  {
    icon: "🔐",
    title: "Encryption in transit and at rest",
    body: "HTTPS protects traffic in transit. Our hosting and database providers apply encryption at rest to the infrastructure they manage.",
  },
  {
    icon: "🛡️",
    title: "Access controls",
    body: "Protected routes require authenticated sessions, sensitive administration routes require an administrator role, and records are scoped to their owner where applicable.",
  },
  {
    icon: "🔒",
    title: "Security-focused infrastructure",
    body: "The service runs on managed infrastructure with platform DDoS protection, isolated deployments, encrypted transport, and controlled environment variables. MansaMusaAI does not currently claim its own SOC 2 certification.",
  },
  {
    icon: "🌍",
    title: "Privacy and UK GDPR",
    body: "Our controls are designed to support UK GDPR responsibilities. Customers remain responsible for lawful collection, notices, consent, and their own use of personal data.",
  },
  {
    icon: "🧪",
    title: "Vulnerability management",
    body: "We scan dependencies, review exposed routes, monitor production errors, and provide a channel for responsible vulnerability reports. Findings are prioritised by severity and impact.",
  },
  {
    icon: "📋",
    title: "Security audit records",
    body: "The application records important account-security events such as successful and failed logins, lockouts, password changes, email changes, and session revocation.",
  },
  {
    icon: "🔑",
    title: "Multi-factor authentication",
    body: "Accounts can enable TOTP two-factor authentication and receive backup codes. Login throttling, lockouts, breached-password checks, and session revocation add further protection.",
  },
  {
    icon: "🏗️",
    title: "Tenant separation",
    body: "Application queries enforce user, team, or administrator ownership rules. We continue to test these boundaries as new features are added.",
  },
];

const PRACTICES = [
  "Dependency vulnerability review and patching",
  "Signed Stripe and Twilio webhook verification",
  "Secrets kept in server-side environment variables",
  "Role and record-ownership checks on sensitive routes",
  "Rate limits on login, registration, AI, and public-write endpoints",
  "Vercel platform-level DDoS protection",
  "Security headers and strict request validation",
  "Production error monitoring and audit records",
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
                Practical, layered safeguards for accounts, customer data, payments, integrations, and production operations.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                {["HTTPS", "2FA", "Signed webhooks", "Rate limiting", "DDoS protection"].map((badge) => (
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
                  Security is ongoing work. These are the controls currently implemented and maintained in the service.
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
                Found a security vulnerability? Please include the affected URL, steps to reproduce, and potential impact. Do not access other people&apos;s data or disrupt the service while testing.
              </p>
              <a
                href="mailto:support@mansamusainitiative.com"
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
            <p className="mt-4 text-gray-400">Review our privacy policy and enable two-factor authentication after creating your account.</p>
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
