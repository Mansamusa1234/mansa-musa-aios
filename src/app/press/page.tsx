import type { Metadata } from "next";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Press & Media | MansaMusaAI",
  description: "Media resources, press kit, and contact information for journalists and content creators covering MansaMusaAI.",
  alternates: { canonical: "/press" },
};

const stats = [
  { label: "Businesses using MansaMusaAI", value: "1,000+" },
  { label: "AI interactions per month",     value: "500K+"  },
  { label: "Hours saved per customer/week", value: "12+"    },
  { label: "Countries",                     value: "15+"    },
];

const faqs = [
  {
    q: "What is MansaMusaAI?",
    a: "MansaMusaAI is an AI Operating System for modern business. It lets companies deploy AI agents that handle calls, automate admin, qualify leads, and run 24/7 — without hiring more staff.",
  },
  {
    q: "Who founded MansaMusaAI?",
    a: "MansaMusaAI was founded in the UK with a mission to make enterprise-grade AI accessible to every business, not just Fortune 500 companies.",
  },
  {
    q: "What makes MansaMusaAI different?",
    a: "Unlike point solutions, MansaMusaAI is a full AI Operating System — one platform that handles voice, messaging, scheduling, CRM, and agent orchestration, all powered by Claude AI.",
  },
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <section className="px-6 py-24 bg-gray-950">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Press & Media</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            MansaMusaAI in the News
          </h1>
          <p className="text-gray-400 text-lg">
            Resources for journalists, podcasters, and content creators covering AI, SaaS, and the future of work.
          </p>
          <a
            href="mailto:media@mansamusainitiative.com"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Contact Media Team →
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-brand-600">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key messages */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Key Messages</h2>
          <ul className="space-y-4">
            {[
              "The average UK SME loses £30,000/year to missed calls and slow follow-up. MansaMusaAI eliminates that gap.",
              "AI agents trained on your business data, not generic chatbots. Every response is on-brand and accurate.",
              "From AI receptionist to full workflow automation — one platform, one subscription, no per-seat pricing.",
              "Built on Claude AI by Anthropic — the most capable and safest AI models available to business today.",
            ].map((msg) => (
              <li key={msg} className="flex gap-3 text-gray-700">
                <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-brand-100 flex items-center justify-center">
                  <svg className="h-3 w-3 text-brand-600" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Press FAQ</h2>
          <div className="space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold text-gray-900">{item.q}</h3>
                <p className="mt-1 text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Get in Touch</h2>
          <p className="text-gray-500 mb-6">
            For interview requests, product demos, expert commentary, or logo/asset requests:
          </p>
          <a
            href="mailto:media@mansamusainitiative.com"
            className="text-brand-600 font-semibold hover:underline text-lg"
          >
            media@mansamusainitiative.com
          </a>
          <p className="mt-2 text-sm text-gray-400">We respond to all press enquiries within 24 hours.</p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
