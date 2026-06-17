"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const STATS = [
  { value: "20%",     label: "Recurring commission"     },
  { value: "60 days", label: "Cookie window"            },
  { value: "Monthly", label: "Payout schedule"          },
  { value: "∞",       label: "Earning potential"        },
];

const STEPS = [
  {
    n: "01",
    icon: "🔗",
    title: "Get your link",
    desc: "Sign up or log into your MansaMusaAI account. Your unique affiliate link is generated instantly from the Affiliate dashboard.",
  },
  {
    n: "02",
    icon: "📣",
    title: "Share and promote",
    desc: "Share your link via blog, social media, email, or YouTube. We give you banners, copy templates, and tracking from day one.",
  },
  {
    n: "03",
    icon: "💰",
    title: "Earn every month",
    desc: "Every customer who subscribes through your link earns you 20% of their monthly subscription — for as long as they stay.",
  },
];

const TIERS = [
  {
    name: "Bronze",
    icon: "🥉",
    refs: "1–10 active referrals",
    commission: "20%",
    perks: ["Monthly payouts", "Affiliate dashboard", "Marketing assets"],
    color: "border-amber-200 bg-amber-50/50",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    name: "Silver",
    icon: "🥈",
    refs: "11–50 active referrals",
    commission: "22%",
    perks: ["Everything in Bronze", "Priority email support", "Co-marketing opportunities"],
    color: "border-gray-300 bg-gray-50",
    badge: "bg-gray-200 text-gray-700",
    featured: false,
  },
  {
    name: "Gold",
    icon: "🥇",
    refs: "51+ active referrals",
    commission: "25%",
    perks: ["Everything in Silver", "Dedicated affiliate manager", "Custom landing pages", "Revenue share bonuses"],
    color: "border-yellow-300 bg-yellow-50/50",
    badge: "bg-yellow-100 text-yellow-800",
    featured: true,
  },
];

const PLANS = [
  { name: "Basic",      price: 19  },
  { name: "Pro",        price: 49  },
  { name: "Enterprise", price: 199 },
];

const FAQS = [
  {
    q: "How do I join the affiliate program?",
    a: "Sign up for a free MansaMusaAI account, then visit /affiliate in your dashboard to access your unique referral link and tracking dashboard.",
  },
  {
    q: "When do I get paid?",
    a: "Commissions are paid on the 15th of each month via Stripe for the previous month's conversions. You need a minimum of £20 to trigger a payout.",
  },
  {
    q: "How long does my cookie last?",
    a: "Your affiliate cookie lasts 60 days. If a visitor clicks your link and subscribes within 60 days, you earn the commission.",
  },
  {
    q: "What happens if a customer upgrades their plan?",
    a: "You earn 20% on whatever plan they're on. If they upgrade from Basic to Pro, your commission increases to 20% of £49.",
  },
  {
    q: "Is there a cap on how much I can earn?",
    a: "There is no cap. Refer 100 Pro customers and earn £980/month every month. The more you refer, the more you earn.",
  },
  {
    q: "Can I promote MansaMusaAI on paid ads?",
    a: "Yes, with restrictions. You may not bid on branded terms like 'MansaMusaAI' in Google Ads. All other paid promotion is allowed.",
  },
];

export default function AffiliateContent() {
  const [referrals, setReferrals] = useState(10);
  const [planIndex, setPlanIndex] = useState(1); // Pro by default
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plan = PLANS[planIndex];
  const monthly = Math.round(referrals * plan.price * 0.20);
  const annual  = monthly * 12;

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 px-6 pb-24 pt-24 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-indigo-500/15 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto max-w-4xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1.5 text-sm font-semibold text-indigo-300">
            💸 MansaMusaAI Affiliate Program
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Earn{" "}
            <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              20% recurring
            </span>
            <br />commission
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-indigo-200 leading-relaxed">
            Refer customers to MansaMusaAI and earn 20% of every monthly payment — for as long as they stay subscribed. No cap. No expiry.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-700 hover:bg-indigo-50 transition-all shadow-lg hover:-translate-y-0.5"
            >
              Join the program free →
            </Link>
            <a
              href="#calculator"
              className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white hover:border-white/40 transition-all"
            >
              Calculate your earnings
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="relative z-10 mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-indigo-300">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Simple process</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Start earning in 3 steps</h2>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-indigo-200 to-transparent" />
                )}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-2xl">
                  {step.icon}
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-500">{step.n}</div>
                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section id="calculator" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Earnings calculator</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">How much could you earn?</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Number of referrals: <span className="text-indigo-600">{referrals}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={referrals}
                    onChange={(e) => setReferrals(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-indigo-100 accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Average plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLANS.map((p, i) => (
                      <button
                        key={p.name}
                        onClick={() => setPlanIndex(i)}
                        className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                          planIndex === i
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:border-indigo-200"
                        }`}
                      >
                        {p.name}
                        <br />
                        <span className="text-xs font-normal">£{p.price}/mo</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-700">
                  <strong>{referrals} × £{plan.price} × 20%</strong> = <strong>£{monthly}/month</strong>
                </div>
              </div>

              {/* Results */}
              <div className="flex flex-col justify-center gap-5">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-center text-white">
                  <p className="text-sm font-medium text-indigo-200 mb-1">Monthly earnings</p>
                  <p className="text-5xl font-extrabold">£{monthly.toLocaleString()}</p>
                  <p className="mt-1 text-indigo-200 text-sm">every month, recurring</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
                  <p className="text-sm font-medium text-gray-500 mb-1">Annual earnings</p>
                  <p className="text-3xl font-extrabold text-gray-900">£{annual.toLocaleString()}</p>
                  <p className="mt-1 text-gray-400 text-xs">if all {referrals} stay subscribed for 12 months</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tier system */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Tier system</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Grow your commission as you grow</h2>
            <p className="mt-3 text-lg text-gray-500">The more active referrals you have, the higher your commission rate.</p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-6 ${tier.color} ${tier.featured ? "ring-2 ring-yellow-400 shadow-lg" : ""}`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900 shadow">Best tier</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{tier.icon}</span>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tier.badge}`}>{tier.name}</span>
                    <p className="mt-1 text-xs text-gray-500">{tier.refs}</p>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-gray-900 mb-4">{tier.commission} <span className="text-sm font-normal text-gray-500">commission</span></p>
                <ul className="space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-indigo-500 flex-shrink-0 mt-0.5">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can promote */}
      <section className="bg-indigo-950 px-6 py-20">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-2">What to promote</p>
            <h2 className="text-3xl font-extrabold text-white">A product people actually want</h2>
            <p className="mt-4 text-indigo-200 leading-relaxed">
              MansaMusaAI solves real business problems — AI workforce management, multi-agent competition, fintech-grade security. It practically sells itself.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "41 specialist AI agents — something for every niche",
                "AI Competition System — completely unique in the market",
                "Wisdom Arena debate system — shareable, viral content potential",
                "Free plan forever — very easy first conversion",
                "GBP pricing — targets UK/EU audiences underserved by USD tools",
              ].map((b) => (
                <li key={b} className="flex gap-3 items-start text-sm text-indigo-200">
                  <span className="text-indigo-400 flex-shrink-0 mt-0.5">✓</span> {b}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            {[
              { plan: "Basic",      price: "£19", earn: "£3.80",  per: "/mo" },
              { plan: "Pro",        price: "£49", earn: "£9.80",  per: "/mo" },
              { plan: "Enterprise", price: "£199",earn: "£39.80", per: "/mo" },
            ].map((r) => (
              <div key={r.plan} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <div>
                  <p className="font-semibold text-white">{r.plan} subscriber</p>
                  <p className="text-sm text-indigo-300">{r.price}/mo subscription</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-indigo-300">{r.earn}</p>
                  <p className="text-xs text-indigo-500">per month{r.per}</p>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-indigo-500 pt-2">Per referral, recurring every month they stay subscribed.</p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">FAQ</p>
            <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Common questions</h2>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <span className={`ml-4 flex-shrink-0 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}>
                    ▼
                  </span>
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
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="text-4xl font-extrabold text-white">Start earning today.</h2>
          <p className="mt-4 text-indigo-100 text-lg">
            Join free. Get your affiliate link in 60 seconds. No approval required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-700 hover:bg-indigo-50 transition-all shadow-lg hover:-translate-y-0.5"
            >
              Create free account →
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/30 px-8 py-4 text-base font-semibold text-white hover:border-white/50 transition-all"
            >
              See what you&apos;re promoting
            </Link>
          </div>
          <p className="mt-5 text-sm text-indigo-300">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white hover:underline">
              Sign in →
            </Link>
          </p>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
}
