"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger, staggerSlow, scaleIn } from "@/lib/motion";
import type { PricingPlan } from "@/types";

const tableFeatures = [
  { label: "AI messages / month",    values: ["20", "500", "Unlimited", "Unlimited"] },
  { label: "AI model",               values: ["Haiku 4.5", "Haiku 4.5", "Sonnet 4.6", "Opus 4.8"] },
  { label: "Conversation history",   values: ["7 days", "30 days", "Unlimited", "Unlimited"] },
  { label: "AI Agent Hub",           values: [false, "10 agents", "All 41", "All 41"] },
  { label: "Analytics dashboard",    values: ["Basic", "Standard", "Advanced", "Enterprise"] },
  { label: "API access",             values: [false, false, true, true] },
  { label: "Priority support",       values: [false, "Email", "Priority", "Dedicated"] },
  { label: "Custom agent memory",    values: [false, false, true, true] },
  { label: "Team workspaces",        values: [false, false, false, true] },
  { label: "SSO / SAML",            values: [false, false, false, true] },
  { label: "Custom fine-tuning",     values: [false, false, false, true] },
  { label: "Invoice downloads",      values: [false, true, true, true] },
  { label: "Cancel anytime",         values: [true, true, true, true] },
];

const faqs = [
  { q: "Can I change plans at any time?", a: "Yes. Upgrade or downgrade at any time. Changes take effect immediately and we'll prorate any difference." },
  { q: "What happens when I hit my message limit?", a: "On the Free plan, you'll need to upgrade to continue chatting. Paid plans will notify you before limits are reached." },
  { q: "Do you offer a free trial?", a: "The Free plan is permanent — no trial period, no credit card required. Use it forever or upgrade when you need more." },
  { q: "What currencies do you accept?", a: "We bill in GBP (British Pounds). All prices shown include VAT where applicable." },
  { q: "Is there an annual discount?", a: "Annual billing is coming soon and will include a 20% discount. Join the waitlist to be notified first." },
  { q: "What's your refund policy?", a: "We offer a 7-day money-back guarantee on all paid plans. No questions asked." },
];

interface Props { plans: PricingPlan[] }

export default function PricingContent({ plans }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-3xl">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-600">Pricing</motion.p>
          <motion.h1 variants={fadeUp} className="mt-3 text-5xl font-extrabold tracking-tight text-gray-900">
            Invest in your AI workforce
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-xl text-gray-500">
            Start free. Scale as you grow. No hidden fees, no lock-in.
          </motion.p>
        </motion.div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
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

              return (
                <motion.div
                  key={plan.id}
                  variants={scaleIn}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`relative flex flex-col rounded-2xl border p-6 ${
                    plan.highlighted
                      ? "border-brand-400 bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-500/25"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-600 shadow-sm">Most popular</span>
                    </div>
                  )}
                  <p className={`text-xs font-bold uppercase tracking-widest ${plan.highlighted ? "text-brand-100" : "text-brand-600"}`}>{plan.name}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>{price}</span>
                    {plan.price > 0 && <span className={`mb-1 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-400"}`}>/mo</span>}
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlighted ? "text-brand-100" : "text-gray-500"}`}>{plan.description}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <span className={plan.highlighted ? "text-brand-100" : "text-brand-500"}>✓</span>
                        <span className={plan.highlighted ? "text-brand-50" : "text-gray-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                      plan.highlighted
                        ? "bg-white text-brand-600 hover:bg-brand-50"
                        : "border border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    }`}
                  >
                    {plan.price === 0 ? "Start free" : "Get started"}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center text-3xl font-bold text-gray-900">
            Full feature comparison
          </motion.h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 pl-6 text-left text-sm font-semibold text-gray-700 w-1/3">Feature</th>
                  {["Free", "Basic", "Pro", "Enterprise"].map((p, i) => (
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
                        {v === true ? (
                          <span className="text-green-500 font-bold">✓</span>
                        ) : v === false ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <span className={`text-sm ${vi === 2 ? "font-semibold text-brand-600" : "text-gray-600"}`}>{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center text-3xl font-bold text-gray-900">
            Frequently asked questions
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <span className={`flex-shrink-0 ml-4 text-brand-500 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-500 px-6 py-16 text-center">
        <h2 className="text-3xl font-extrabold text-white">Start for free today</h2>
        <p className="mt-3 text-brand-100">No credit card required. Upgrade anytime.</p>
        <Link href="/register" className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-600 hover:bg-brand-50 transition-colors shadow-lg">
          Create your free account →
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
