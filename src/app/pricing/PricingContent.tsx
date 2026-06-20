"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger, staggerSlow, scaleIn } from "@/lib/motion";
import type { PricingPlan } from "@/types";

const tableFeatures = [
  { label: "AI receptionist",         values: ["1 (chat only)", "1", "3", "Unlimited"]                 },
  { label: "Calls / chats per month", values: ["50", "200", "Unlimited", "Unlimited"]                  },
  { label: "Lead capture & CRM",      values: [true, true, true, true]                                  },
  { label: "Appointment booking",     values: [false, true, true, true]                                 },
  { label: "WhatsApp integration",    values: [false, false, true, true]                                },
  { label: "Email automation",        values: [false, false, true, true]                                },
  { label: "Affiliate programme",     values: [false, false, true, true]                                },
  { label: "CRM integration",         values: [false, false, "200+ tools", "Custom"]                   },
  { label: "Languages supported",     values: ["3", "10", "30+", "30+"]                                },
  { label: "Analytics dashboard",     values: ["Basic", "Standard", "Advanced", "Enterprise"]           },
  { label: "Custom branding",         values: [false, false, false, true]                               },
  { label: "SSO / SAML",             values: [false, false, false, true]                                },
  { label: "Dedicated account mgr",   values: [false, false, false, true]                               },
  { label: "SLA guarantee",           values: [false, false, false, true]                               },
  { label: "Cancel anytime",          values: [true, true, true, true]                                  },
];

const faqs = [
  { q: "Is there a free trial?",                  a: "Yes — every new account gets a 14-day free trial of Professional. No credit card required. After the trial, choose a paid plan or stay on the free tier." },
  { q: "Can I change plans at any time?",         a: "Yes. Upgrade or downgrade instantly. We prorate any difference to the day." },
  { q: "How does the AI receptionist work?",      a: "You configure a name, greeting, and persona. It then answers enquiries on your website chat and WhatsApp (Professional+), books appointments into your calendar, and pushes leads into your CRM — automatically, 24/7." },
  { q: "What currencies do you accept?",          a: "We bill in GBP. All prices are shown per month and include VAT where applicable." },
  { q: "Is there an annual discount?",            a: "Annual billing with a 20% discount is coming soon. Register to be notified." },
  { q: "What's your refund policy?",              a: "7-day money-back guarantee on all paid plans. No questions asked." },
  { q: "Can I earn as an affiliate?",             a: "Yes. Professional and Enterprise users get access to our affiliate programme — earn 20% recurring commission on every business you refer, with no cap." },
];

const INDUSTRIES = [
  { emoji: "🦷", name: "Dentists" },
  { emoji: "🍽️", name: "Restaurants" },
  { emoji: "🏗️", name: "Scaffolding" },
  { emoji: "📊", name: "Accountants" },
  { emoji: "🏡", name: "Estate agents" },
  { emoji: "🚗", name: "Car dealerships" },
];

interface Props { plans: PricingPlan[] }

export default function PricingContent({ plans }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleCheckout(priceId: string, planId: string) {
    setCheckoutError(null);
    if (!priceId) {
      // Free plan — logged-in users go to dashboard, others to register
      const res = await fetch("/api/auth/session");
      const s = await res.json().catch(() => null);
      window.location.href = s?.user ? "/dashboard" : "/register";
      return;
    }
    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 401) { window.location.href = "/login?redirect=/pricing"; return; }
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error ?? "Could not start checkout. Please try again.");
      }
    } catch {
      setCheckoutError("Could not connect. Please check your connection and try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const planNames = plans.map((p) => p.name);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="px-6 py-20 text-center bg-gradient-to-b from-gray-950 to-gray-900">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-3xl">
          <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-400">Pricing</motion.p>
          <motion.h1 variants={fadeUp} className="mt-3 text-5xl font-extrabold tracking-tight text-white">
            One employee costs more than this
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-xl text-gray-400">
            Your AI receptionist answers every call, captures every lead, and books every appointment — starting from £49/mo.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {INDUSTRIES.map((ind) => (
              <span key={ind.name} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                {ind.emoji} {ind.name}
              </span>
            ))}
          </motion.div>
          <motion.p variants={fadeUp} className="mt-6 text-sm text-gray-500">
            14-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </motion.div>
      </section>

      {/* Plans */}
      <section className="px-6 py-20 bg-gray-950">
        <div className="mx-auto max-w-6xl">
          {checkoutError && (
            <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-400 text-center">
              {checkoutError}
            </div>
          )}
          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {plans.map((plan) => {
              const price =
                plan.price === 0
                  ? "Free"
                  : new Intl.NumberFormat("en-GB", { style: "currency", currency: plan.currency.toUpperCase(), minimumFractionDigits: 0 }).format(plan.price);

              const isLoading = checkoutLoading === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  variants={scaleIn}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    plan.highlighted
                      ? "border-brand-400 bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/30"
                      : "border-white/10 bg-white/5 text-white"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-600 shadow-sm">Most popular</span>
                    </div>
                  )}
                  <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlighted ? "text-brand-100" : "text-brand-400"}`}>{plan.name}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-4xl font-extrabold">{price}</span>
                    {plan.price > 0 && <span className={`mb-1 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-400"}`}>/mo</span>}
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-400"}`}>{plan.description}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className={plan.highlighted ? "text-brand-200" : "text-brand-400"}>✓</span>
                        <span className={plan.highlighted ? "text-brand-50" : "text-gray-300"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCheckout(plan.priceId, plan.id)}
                    disabled={isLoading}
                    className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all disabled:opacity-60 ${
                      plan.highlighted
                        ? "bg-white text-brand-600 hover:bg-brand-50"
                        : plan.price === 0
                        ? "border border-white/20 text-white hover:border-white/40"
                        : "border border-brand-500 text-brand-400 hover:bg-brand-500 hover:text-white"
                    }`}
                  >
                    {isLoading ? "Loading…" : plan.price === 0 ? "Start free" : "Start 14-day trial"}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-10 text-center text-3xl font-bold text-gray-900">
            Full feature comparison
          </motion.h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-4 pl-6 text-left text-sm font-semibold text-gray-700 w-1/3">Feature</th>
                  {planNames.map((p, i) => (
                    <th key={p} className={`py-4 px-4 text-center text-sm font-bold ${i === 2 ? "text-brand-600" : "text-gray-700"}`}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableFeatures.map((row, ri) => (
                  <tr key={row.label} className={`border-b border-gray-50 ${ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="py-3.5 pl-6 text-sm text-gray-700">{row.label}</td>
                    {row.values.map((v, vi) => (
                      <td key={vi} className="py-3.5 px-4 text-center">
                        {v === true  ? <span className="text-green-500 font-bold">✓</span>
                       : v === false ? <span className="text-gray-300">—</span>
                       : <span className={`text-sm ${vi === 2 ? "font-semibold text-brand-600" : "text-gray-600"}`}>{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-gray-950 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-8">Trusted by businesses across the UK</p>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { stat: "24/7", label: "Always answering" },
              { stat: "< 2s", label: "Response time" },
              { stat: "30+", label: "Languages" },
              { stat: "20%", label: "Affiliate commission" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-white">{s.stat}</p>
                <p className="mt-1 text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-10 text-center text-3xl font-bold text-gray-900">
            Frequently asked questions
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }} className="rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                  {faq.q}
                  <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} className="flex-shrink-0 ml-4 text-brand-500 text-xl leading-none">+</motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden">
                      <div className="border-t border-gray-100 px-5 py-4">
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand-600 to-indigo-700 px-6 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-white">Start your 14-day free trial</h2>
        <p className="mt-3 text-brand-100">Full Professional access. No credit card required.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-600 hover:bg-brand-50 transition-colors shadow-lg">
            Start free trial →
          </Link>
          <Link href="/contact" className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:border-white/60 transition-colors">
            Talk to sales
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
