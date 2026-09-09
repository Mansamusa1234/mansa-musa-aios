import type { AttributionEventInput, CampaignMetric } from "./types";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

async function request(path: string, init: RequestInit) {
  const cfg = config();
  if (!cfg) return { configured: false as const };
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase mirror failed (${res.status}): ${await res.text()}`);
  return { configured: true as const };
}

export async function mirrorCampaignsToSupabase(userId: string, campaigns: CampaignMetric[]) {
  if (!config() || campaigns.length === 0) return { configured: Boolean(config()), mirrored: 0 };
  const payload = campaigns.map((c) => ({
    user_id: userId,
    platform: c.platform,
    external_id: c.externalId || c.id,
    name: c.name,
    status: c.status,
    spend_cents: Math.round(c.spend * 100),
    revenue_cents: Math.round(c.revenue * 100),
    impressions: Math.round(c.impressions),
    clicks: Math.round(c.clicks),
    conversions: c.conversions,
    ctr: c.ctr,
    cpa_cents: Math.round(c.cpa * 100),
    roas: c.roas,
    daily_budget_cents: Math.round(c.dailyBudget * 100),
    synced_at: c.syncedAt || new Date().toISOString(),
  }));
  await request("mansa_ad_campaigns?on_conflict=user_id,platform,external_id", { method: "POST", body: JSON.stringify(payload) });
  return { configured: true, mirrored: payload.length };
}

export async function mirrorAttributionToSupabase(userId: string, eventId: string, input: AttributionEventInput) {
  if (!config()) return { configured: false };
  await request("mansa_ad_attribution_events", {
    method: "POST",
    body: JSON.stringify({
      id: eventId,
      user_id: userId,
      event_type: input.eventType,
      campaign_external_id: input.campaignExternalId || null,
      platform: input.platform || null,
      amount_cents: input.amountCents || 0,
      currency: input.currency || "GBP",
      email: input.email || null,
      external_event_id: input.externalEventId || null,
      metadata: input.metadata || {},
      created_at: new Date().toISOString(),
    }),
  });
  return { configured: true };
}
