import type { AdPlatform, AdsSyncResult, ProviderCampaign } from "./types";

const n = (value: unknown) => Number(value ?? 0) || 0;
const pct = (clicks: number, impressions: number) => impressions > 0 ? (clicks / impressions) * 100 : 0;

function status(value: unknown): ProviderCampaign["status"] {
  const s = String(value ?? "").toUpperCase();
  if (s.includes("ACTIVE") || s === "ENABLED") return "ACTIVE";
  if (s.includes("PAUSED") || s === "DISABLED") return "PAUSED";
  if (s.includes("DRAFT")) return "DRAFT";
  return "UNKNOWN";
}

export function configuredPlatforms(): Record<AdPlatform, boolean> {
  return {
    META: Boolean(process.env.META_AD_ACCOUNT_ID && process.env.META_ADS_ACCESS_TOKEN),
    GOOGLE: Boolean(process.env.GOOGLE_ADS_CUSTOMER_ID && process.env.GOOGLE_ADS_ACCESS_TOKEN && process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
    TIKTOK: Boolean(process.env.TIKTOK_ADVERTISER_ID && process.env.TIKTOK_ADS_ACCESS_TOKEN),
  };
}

export async function fetchMetaCampaigns(): Promise<ProviderCampaign[]> {
  const account = process.env.META_AD_ACCOUNT_ID?.replace(/^act_/, "");
  const token = process.env.META_ADS_ACCESS_TOKEN;
  if (!account || !token) return [];

  const version = process.env.META_GRAPH_API_VERSION || "v23.0";
  const fields = "id,name,status,daily_budget,lifetime_budget,insights.date_preset(last_7d){spend,impressions,clicks,actions,action_values}";
  const url = new URL(`https://graph.facebook.com/${version}/act_${account}/campaigns`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `Meta Ads API ${res.status}`);

  return (json.data ?? []).map((item: any) => {
    const insight = item.insights?.data?.[0] ?? {};
    const impressions = n(insight.impressions);
    const clicks = n(insight.clicks);
    const spend = n(insight.spend);
    const purchaseAction = (insight.actions ?? []).find((a: any) => ["purchase", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type));
    const purchaseValue = (insight.action_values ?? []).find((a: any) => ["purchase", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type));
    const conversions = n(purchaseAction?.value);
    const revenue = n(purchaseValue?.value);
    const dailyBudget = n(item.daily_budget) / 100;
    return {
      id: `META:${item.id}`,
      externalId: String(item.id),
      externalBudgetId: String(item.id),
      name: item.name || `Meta ${item.id}`,
      platform: "META" as const,
      status: status(item.status),
      currency: process.env.META_ADS_CURRENCY || "GBP",
      spend,
      revenue,
      impressions,
      clicks,
      conversions,
      ctr: pct(clicks, impressions),
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? revenue / spend : 0,
      dailyBudget,
    };
  });
}

export async function fetchGoogleCampaigns(): Promise<ProviderCampaign[]> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, "");
  const token = process.env.GOOGLE_ADS_ACCESS_TOKEN;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!customerId || !token || !developerToken) return [];

  const version = process.env.GOOGLE_ADS_API_VERSION || "v18";
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.resource_name,
      campaign_budget.amount_micros,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS
  `;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  };
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "");

  const res = await fetch(`https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `Google Ads API ${res.status}`);

  return (json.results ?? []).map((row: any) => {
    const m = row.metrics ?? {};
    const impressions = n(m.impressions);
    const clicks = n(m.clicks);
    const spend = n(m.costMicros) / 1_000_000;
    const conversions = n(m.conversions);
    const revenue = n(m.conversionsValue);
    return {
      id: `GOOGLE:${row.campaign.id}`,
      externalId: String(row.campaign.id),
      externalBudgetId: row.campaignBudget?.resourceName,
      name: row.campaign.name || `Google ${row.campaign.id}`,
      platform: "GOOGLE" as const,
      status: status(row.campaign.status),
      currency: process.env.GOOGLE_ADS_CURRENCY || "GBP",
      spend,
      revenue,
      impressions,
      clicks,
      conversions,
      ctr: pct(clicks, impressions),
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? revenue / spend : 0,
      dailyBudget: n(row.campaignBudget?.amountMicros) / 1_000_000,
    };
  });
}

export async function fetchTikTokCampaigns(): Promise<ProviderCampaign[]> {
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;
  const token = process.env.TIKTOK_ADS_ACCESS_TOKEN;
  if (!advertiserId || !token) return [];

  const url = new URL("https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/");
  url.searchParams.set("advertiser_id", advertiserId);
  url.searchParams.set("report_type", "BASIC");
  url.searchParams.set("data_level", "AUCTION_CAMPAIGN");
  url.searchParams.set("dimensions", JSON.stringify(["campaign_id"]));
  url.searchParams.set("metrics", JSON.stringify(["campaign_name", "spend", "impressions", "clicks", "conversion", "total_purchase_value"]));
  url.searchParams.set("start_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  url.searchParams.set("end_date", new Date().toISOString().slice(0, 10));
  url.searchParams.set("page_size", "100");

  const res = await fetch(url, { headers: { "Access-Token": token }, cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.code !== 0) throw new Error(json?.message || `TikTok Ads API ${res.status}`);

  return (json.data?.list ?? []).map((row: any) => {
    const d = row.dimensions ?? {};
    const m = row.metrics ?? {};
    const impressions = n(m.impressions);
    const clicks = n(m.clicks);
    const spend = n(m.spend);
    const conversions = n(m.conversion);
    const revenue = n(m.total_purchase_value);
    return {
      id: `TIKTOK:${d.campaign_id}`,
      externalId: String(d.campaign_id),
      externalBudgetId: String(d.campaign_id),
      name: m.campaign_name || `TikTok ${d.campaign_id}`,
      platform: "TIKTOK" as const,
      status: "UNKNOWN" as const,
      currency: process.env.TIKTOK_ADS_CURRENCY || "GBP",
      spend,
      revenue,
      impressions,
      clicks,
      conversions,
      ctr: pct(clicks, impressions),
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? revenue / spend : 0,
      dailyBudget: 0,
    };
  });
}

export async function syncProviderCampaigns(): Promise<{ campaigns: ProviderCampaign[]; results: AdsSyncResult[] }> {
  const cfg = configuredPlatforms();
  const jobs: Array<[AdPlatform, () => Promise<ProviderCampaign[]>]> = [
    ["META", fetchMetaCampaigns],
    ["GOOGLE", fetchGoogleCampaigns],
    ["TIKTOK", fetchTikTokCampaigns],
  ];
  const campaigns: ProviderCampaign[] = [];
  const results: AdsSyncResult[] = [];

  for (const [platform, job] of jobs) {
    if (!cfg[platform]) {
      results.push({ platform, configured: false, synced: 0 });
      continue;
    }
    try {
      const rows = await job();
      campaigns.push(...rows);
      results.push({ platform, configured: true, synced: rows.length });
    } catch (error) {
      results.push({ platform, configured: true, synced: 0, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { campaigns, results };
}

export async function executeBudgetChange(args: {
  platform: AdPlatform;
  externalBudgetId: string;
  currentBudgetCents: number;
  changePct: number;
}) {
  const nextCents = Math.max(100, Math.round(args.currentBudgetCents * (1 + args.changePct / 100)));

  if (args.platform === "META") {
    const token = process.env.META_ADS_ACCESS_TOKEN;
    if (!token) throw new Error("Meta Ads access token is not configured");
    const version = process.env.META_GRAPH_API_VERSION || "v23.0";
    const body = new URLSearchParams({ daily_budget: String(nextCents), access_token: token });
    const res = await fetch(`https://graph.facebook.com/${version}/${args.externalBudgetId}`, { method: "POST", body });
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json?.error?.message || `Meta budget update failed (${res.status})`);
    return { nextBudgetCents: nextCents, providerResponse: json };
  }

  if (args.platform === "GOOGLE") {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, "");
    const token = process.env.GOOGLE_ADS_ACCESS_TOKEN;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!customerId || !token || !developerToken) throw new Error("Google Ads credentials are not configured");
    const version = process.env.GOOGLE_ADS_API_VERSION || "v18";
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "developer-token": developerToken, "Content-Type": "application/json" };
    if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers["login-customer-id"] = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, "");
    const res = await fetch(`https://googleads.googleapis.com/${version}/customers/${customerId}/campaignBudgets:mutate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ operations: [{ updateMask: "amount_micros", update: { resourceName: args.externalBudgetId, amountMicros: String(nextCents * 10_000) } }] }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || `Google budget update failed (${res.status})`);
    return { nextBudgetCents: nextCents, providerResponse: json };
  }

  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;
  const token = process.env.TIKTOK_ADS_ACCESS_TOKEN;
  if (!advertiserId || !token) throw new Error("TikTok Ads credentials are not configured");
  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/campaign/update/", {
    method: "POST",
    headers: { "Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ advertiser_id: advertiserId, campaign_id: args.externalBudgetId, budget: nextCents / 100 }),
  });
  const json = await res.json();
  if (!res.ok || json.code !== 0) throw new Error(json?.message || `TikTok budget update failed (${res.status})`);
  return { nextBudgetCents: nextCents, providerResponse: json };
}
