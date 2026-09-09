import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { configuredPlatforms } from "@/lib/ads/providers";
import { listCampaigns, listDecisions } from "@/lib/ads/store";
import type { CampaignMetric } from "@/lib/ads/types";
import PaidAdsControls from "./PaidAdsControls";

export const metadata: Metadata = {
  title: "Paid Ads Growth Agent | MansaMusaAI",
  description: "AI-assisted paid advertising command centre for Meta, Google, TikTok, Stripe attribution and CRM.",
};

export const dynamic = "force-dynamic";

const demoCampaigns: CampaignMetric[] = [
  { id: "demo-meta", externalId: "demo-meta", name: "Mansa Musa AI — Founder Offer", platform: "META", status: "ACTIVE", spend: 420, revenue: 1890, impressions: 68400, clicks: 1915, conversions: 27, ctr: 2.8, previousCtr: 2.9, cpa: 15.56, roas: 4.5, dailyBudget: 60 },
  { id: "demo-google", externalId: "demo-google", name: "AI Operating System — Search", platform: "GOOGLE", status: "ACTIVE", spend: 510, revenue: 980, impressions: 22700, clicks: 1044, conversions: 12, ctr: 4.6, previousCtr: 4.7, cpa: 42.5, roas: 1.92, dailyBudget: 70 },
  { id: "demo-tiktok", externalId: "demo-tiktok", name: "Stop Wasting Ad Spend", platform: "TIKTOK", status: "ACTIVE", spend: 285, revenue: 260, impressions: 103200, clicks: 1238, conversions: 4, ctr: 1.2, previousCtr: 1.8, cpa: 71.25, roas: 0.91, dailyBudget: 45 },
];

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export default async function PaidAdsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const stored = await listCampaigns(userId);
  const campaigns = stored.length ? stored : demoCampaigns;
  const decisions = await listDecisions(userId, 12);
  const config = configuredPlatforms();

  const approvalRows = await db.approvalRequest.findMany({
    where: { userId, action: "AD_BUDGET_CHANGE", status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const approvals = approvalRows.map((row) => {
    try {
      const p = JSON.parse(row.payload);
      return { id: row.id, campaignName: p.campaignName || "Campaign", platform: p.platform, budgetChangePct: p.budgetChangePct };
    } catch {
      return { id: row.id, campaignName: "Campaign" };
    }
  });

  const spend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const revenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const conversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const blendedRoas = spend ? revenue / spend : 0;
  const blendedCtr = impressions ? (clicks / impressions) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Mansa Musa Growth Agent</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Paid Ads Command Centre</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Meta, Google and TikTok campaign intelligence with Stripe revenue attribution, CRM lead capture, creative-fatigue detection and approval-controlled budget execution.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {(["META", "GOOGLE", "TIKTOK"] as const).map((platform) => (
            <span key={platform} className={`rounded-full border px-2.5 py-1 font-semibold ${config[platform] ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-gray-500"}`}>
              {platform} {config[platform] ? "CONNECTED" : "NEEDS KEYS"}
            </span>
          ))}
          <span className={`rounded-full border px-2.5 py-1 font-semibold ${process.env.STRIPE_SECRET_KEY ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-gray-500"}`}>STRIPE {process.env.STRIPE_SECRET_KEY ? "CONNECTED" : "NEEDS KEY"}</span>
        </div>
      </div>

      <PaidAdsControls approvals={approvals} />

      {!stored.length && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-200">
          Demo campaign figures are being shown until at least one live ad account is configured and synced.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Ad Spend", money.format(spend)],
          ["Attributed Revenue", money.format(revenue)],
          ["Blended ROAS", `${blendedRoas.toFixed(2)}x`],
          ["Conversions", String(Math.round(conversions))],
          ["Blended CTR", `${blendedCtr.toFixed(2)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-white">Campaign performance</h2>
            <p className="text-xs text-gray-500">Seven-day provider snapshots; revenue is replaced by first-party/Stripe attribution when available.</p>
          </div>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-xl border border-white/6 bg-[#0c0c19] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-brand-400">{campaign.platform}</p>
                    <h3 className="mt-1 font-semibold text-gray-100">{campaign.name}</h3>
                    {campaign.syncedAt && <p className="mt-1 text-[10px] text-gray-600">Synced {new Date(campaign.syncedAt).toLocaleString("en-GB")}</p>}
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300">{campaign.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
                  <Metric label="Spend" value={money.format(campaign.spend)} />
                  <Metric label="Revenue" value={money.format(campaign.revenue)} />
                  <Metric label="ROAS" value={`${campaign.roas.toFixed(2)}x`} />
                  <Metric label="CPA" value={money.format(campaign.cpa)} />
                  <Metric label="CTR" value={`${campaign.ctr.toFixed(2)}%`} />
                  <Metric label="Daily budget" value={campaign.dailyBudget ? money.format(campaign.dailyBudget) : "—"} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
          <h2 className="font-semibold text-white">Decision & audit log</h2>
          <p className="mt-1 text-xs text-gray-500">Every Growth Agent recommendation is recorded before any live spend change.</p>
          <div className="mt-4 space-y-3">
            {decisions.length === 0 ? (
              <p className="rounded-xl border border-white/6 bg-[#0c0c19] p-4 text-sm text-gray-500">Run the Growth Agent to create the first decision set.</p>
            ) : decisions.map((d: any) => (
              <div key={String(d.id)} className="rounded-xl border border-white/6 bg-[#0c0c19] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold tracking-wider text-brand-300">{String(d.action_type).replace("_", " ")}</span>
                  <span className="text-[10px] font-semibold text-gray-500">{String(d.status)}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-200">{String(d.campaign_name)}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{String(d.reason)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] uppercase tracking-wider text-gray-600">{label}</p><p className="mt-1 font-semibold text-gray-200">{value}</p></div>;
}
