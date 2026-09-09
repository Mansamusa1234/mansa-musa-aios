import type { Metadata } from "next";
import { recommendGrowthAction } from "@/lib/ads/optimizer";
import type { CampaignMetric } from "@/lib/ads/types";

export const metadata: Metadata = {
  title: "Paid Ads Growth Agent | MansaMusaAI",
  description: "AI-assisted paid advertising command centre for Meta, Google and TikTok campaigns.",
};

const demoCampaigns: CampaignMetric[] = [
  {
    id: "meta-1",
    name: "Mansa Musa AI — Founder Offer",
    platform: "META",
    status: "ACTIVE",
    spend: 420,
    revenue: 1890,
    impressions: 68400,
    clicks: 1915,
    conversions: 27,
    ctr: 2.8,
    previousCtr: 2.9,
    cpa: 15.56,
    roas: 4.5,
    dailyBudget: 60,
  },
  {
    id: "google-1",
    name: "AI Operating System — Search",
    platform: "GOOGLE",
    status: "ACTIVE",
    spend: 510,
    revenue: 980,
    impressions: 22700,
    clicks: 1044,
    conversions: 12,
    ctr: 4.6,
    previousCtr: 4.7,
    cpa: 42.5,
    roas: 1.92,
    dailyBudget: 70,
  },
  {
    id: "tiktok-1",
    name: "Stop Wasting Ad Spend",
    platform: "TIKTOK",
    status: "ACTIVE",
    spend: 285,
    revenue: 260,
    impressions: 103200,
    clicks: 1238,
    conversions: 4,
    ctr: 1.2,
    previousCtr: 1.8,
    cpa: 71.25,
    roas: 0.91,
    dailyBudget: 45,
  },
];

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export default function PaidAdsPage() {
  const actions = demoCampaigns.map(recommendGrowthAction);
  const spend = demoCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const revenue = demoCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const conversions = demoCampaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const blendedRoas = spend ? revenue / spend : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Mansa Musa Growth Agent</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Paid Ads Command Centre</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            One workspace for Meta, Google and TikTok performance, creative fatigue detection, budget recommendations and approval-controlled optimization.
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-200">
          Demo data active · live account writes remain approval-gated
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Ad Spend", money.format(spend)],
          ["Revenue", money.format(revenue)],
          ["Blended ROAS", `${blendedRoas.toFixed(2)}x`],
          ["Conversions", String(conversions)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Campaign performance</h2>
              <p className="text-xs text-gray-500">Cross-platform operating view</p>
            </div>
          </div>
          <div className="space-y-3">
            {demoCampaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-xl border border-white/6 bg-[#0c0c19] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-brand-400">{campaign.platform}</p>
                    <h3 className="mt-1 font-semibold text-gray-100">{campaign.name}</h3>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    {campaign.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  <Metric label="Spend" value={money.format(campaign.spend)} />
                  <Metric label="Revenue" value={money.format(campaign.revenue)} />
                  <Metric label="ROAS" value={`${campaign.roas.toFixed(2)}x`} />
                  <Metric label="CPA" value={money.format(campaign.cpa)} />
                  <Metric label="CTR" value={`${campaign.ctr.toFixed(2)}%`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <h2 className="font-semibold text-white">Growth Agent decisions</h2>
          <p className="mt-1 text-xs text-gray-500">Recommendations explain why money should move.</p>
          <div className="mt-4 space-y-3">
            {actions.map((action) => (
              <div key={action.id} className="rounded-xl border border-white/6 bg-[#0c0c19] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold tracking-wider text-brand-300">{action.type.replace("_", " ")}</span>
                  {action.requiresApproval && (
                    <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-300">APPROVAL REQUIRED</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-200">{action.campaignName}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{action.reason}</p>
                {action.budgetChangePct !== undefined && (
                  <p className="mt-3 text-xs font-semibold text-gray-300">Suggested budget change: {action.budgetChangePct > 0 ? "+" : ""}{action.budgetChangePct}%</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="mt-1 font-semibold text-gray-200">{value}</p>
    </div>
  );
}
