import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Revenue Intelligence",
  description: "Turn automation and privacy-safe business analytics into recurring revenue, reports, API access and white-label services.",
};

const OFFERS = [
  {
    label: "Recurring SaaS",
    price: "From £49/month",
    body: "AI receptionists, CRM, automation and analytics sold as monthly or discounted annual subscriptions.",
    href: "/pricing",
    cta: "See subscriptions",
  },
  {
    label: "Done-for-you setup",
    price: "From £499 once",
    body: "Paid onboarding, workflow design, agent configuration, integrations and staff training.",
    href: "/contact?offering=done-for-you%20setup",
    cta: "Request setup",
  },
  {
    label: "Benchmark reports",
    price: "From £299/report",
    body: "Privacy-safe performance reports using a customer’s own operational data and anonymised market benchmarks.",
    href: "/contact?offering=benchmark%20report",
    cta: "Order a report",
  },
  {
    label: "Analytics API",
    price: "From £499/month",
    body: "Secure exports, scheduled reports and API access for teams that need data in their own BI systems.",
    href: "/contact?offering=analytics%20API",
    cta: "Discuss API access",
  },
  {
    label: "White-label licensing",
    price: "Custom annual contract",
    body: "Agencies and operators can resell a branded version with managed onboarding and volume pricing.",
    href: "/contact?offering=white-label%20licence",
    cta: "Become a reseller",
  },
  {
    label: "Affiliate income",
    price: "20% recurring",
    body: "Partners earn recurring commission on qualifying customers they introduce to MansaMusaAI.",
    href: "/affiliate",
    cta: "Join the programme",
  },
];

export default function RevenueIntelligencePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <section className="bg-gray-950 px-6 py-24 text-white">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-400">Revenue Intelligence</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">
              Six ethical revenue streams. One AI platform.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-400">
              Monetise useful software, implementation and privacy-safe insights—not people’s identities or raw personal data.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/pricing" className="rounded-xl bg-brand-500 px-7 py-3 text-sm font-semibold text-white hover:bg-brand-600">
                Start a subscription
              </Link>
              <Link href="/contact?offering=revenue%20strategy" className="rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:border-white/40">
                Build a custom package
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {OFFERS.map((offer) => (
                <article key={offer.label} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{offer.label}</p>
                  <p className="mt-3 text-2xl font-extrabold text-gray-950">{offer.price}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{offer.body}</p>
                  <Link href={offer.href} className="mt-6 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">
                    {offer.cta} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 px-6 py-16">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div>
              <h2 className="font-bold text-gray-950">Consent first</h2>
              <p className="mt-2 text-sm text-gray-600">Only use data customers are authorised to provide and analyse.</p>
            </div>
            <div>
              <h2 className="font-bold text-gray-950">Aggregate insights</h2>
              <p className="mt-2 text-sm text-gray-600">Remove direct identifiers before producing cross-customer benchmarks.</p>
            </div>
            <div>
              <h2 className="font-bold text-gray-950">No raw-data resale</h2>
              <p className="mt-2 text-sm text-gray-600">Revenue comes from outcomes, software and reports—not selling personal information.</p>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
