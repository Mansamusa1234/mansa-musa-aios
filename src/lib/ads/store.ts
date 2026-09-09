import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import type { AdPlatform, AttributionEventInput, CampaignMetric, GrowthAction, ProviderCampaign } from "./types";

let initialized = false;

export async function ensureAdsTables() {
  if (initialized) return;

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS mansa_ad_campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      external_id TEXT NOT NULL,
      external_budget_id TEXT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'UNKNOWN',
      currency TEXT NOT NULL DEFAULT 'GBP',
      spend_cents INTEGER NOT NULL DEFAULT 0,
      revenue_cents INTEGER NOT NULL DEFAULT 0,
      impressions BIGINT NOT NULL DEFAULT 0,
      clicks BIGINT NOT NULL DEFAULT 0,
      conversions DOUBLE PRECISION NOT NULL DEFAULT 0,
      ctr DOUBLE PRECISION NOT NULL DEFAULT 0,
      cpa_cents INTEGER NOT NULL DEFAULT 0,
      roas DOUBLE PRECISION NOT NULL DEFAULT 0,
      daily_budget_cents INTEGER NOT NULL DEFAULT 0,
      previous_ctr DOUBLE PRECISION,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, platform, external_id)
    )
  `);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS mansa_ad_attribution_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      campaign_external_id TEXT,
      platform TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'GBP',
      email TEXT,
      external_event_id TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS idx_mansa_ad_event_external ON mansa_ad_attribution_events(user_id, external_event_id) WHERE external_event_id IS NOT NULL`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_mansa_ad_event_campaign ON mansa_ad_attribution_events(user_id, campaign_external_id, created_at)`);

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS mansa_ad_decisions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      platform TEXT,
      action_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      budget_change_pct INTEGER,
      requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
      approval_request_id TEXT,
      status TEXT NOT NULL DEFAULT 'RECOMMENDED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      executed_at TIMESTAMPTZ
    )
  `);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_mansa_ad_decisions_user ON mansa_ad_decisions(user_id, created_at DESC)`);

  initialized = true;
}

export async function upsertCampaigns(userId: string, campaigns: ProviderCampaign[]) {
  await ensureAdsTables();
  for (const c of campaigns) {
    const previous = await db.$queryRawUnsafe<Array<{ ctr: number }>>(
      `SELECT ctr FROM mansa_ad_campaigns WHERE user_id = $1 AND platform = $2 AND external_id = $3 LIMIT 1`,
      userId,
      c.platform,
      c.externalId,
    );
    const id = `${userId}:${c.platform}:${c.externalId}`;
    await db.$executeRawUnsafe(
      `INSERT INTO mansa_ad_campaigns
        (id,user_id,platform,external_id,external_budget_id,name,status,currency,spend_cents,revenue_cents,impressions,clicks,conversions,ctr,cpa_cents,roas,daily_budget_cents,previous_ctr,synced_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW())
       ON CONFLICT (user_id, platform, external_id) DO UPDATE SET
        external_budget_id=EXCLUDED.external_budget_id,
        name=EXCLUDED.name,
        status=EXCLUDED.status,
        currency=EXCLUDED.currency,
        spend_cents=EXCLUDED.spend_cents,
        impressions=EXCLUDED.impressions,
        clicks=EXCLUDED.clicks,
        conversions=EXCLUDED.conversions,
        ctr=EXCLUDED.ctr,
        cpa_cents=EXCLUDED.cpa_cents,
        roas=CASE WHEN mansa_ad_campaigns.revenue_cents > 0 AND EXCLUDED.spend_cents > 0 THEN mansa_ad_campaigns.revenue_cents::double precision / EXCLUDED.spend_cents ELSE EXCLUDED.roas END,
        daily_budget_cents=EXCLUDED.daily_budget_cents,
        previous_ctr=$18,
        synced_at=NOW(),
        updated_at=NOW()`,
      id,
      userId,
      c.platform,
      c.externalId,
      c.externalBudgetId ?? null,
      c.name,
      c.status,
      c.currency ?? "GBP",
      Math.round(c.spend * 100),
      Math.round(c.revenue * 100),
      Math.round(c.impressions),
      Math.round(c.clicks),
      c.conversions,
      c.ctr,
      Math.round(c.cpa * 100),
      c.roas,
      Math.round(c.dailyBudget * 100),
      previous[0]?.ctr ?? c.previousCtr ?? null,
    );
  }
  await refreshAttributedRevenue(userId);
}

export async function refreshAttributedRevenue(userId: string) {
  await ensureAdsTables();
  await db.$executeRawUnsafe(
    `UPDATE mansa_ad_campaigns c
       SET revenue_cents = COALESCE(a.revenue_cents, 0),
           roas = CASE WHEN c.spend_cents > 0 THEN COALESCE(a.revenue_cents, 0)::double precision / c.spend_cents ELSE 0 END,
           updated_at = NOW()
     FROM (
       SELECT campaign_external_id, SUM(amount_cents)::integer AS revenue_cents
       FROM mansa_ad_attribution_events
       WHERE user_id = $1 AND event_type = 'PURCHASE' AND campaign_external_id IS NOT NULL
       GROUP BY campaign_external_id
     ) a
     WHERE c.user_id = $1 AND c.external_id = a.campaign_external_id`,
    userId,
  );
}

type CampaignRow = {
  id: string; external_id: string; external_budget_id: string | null; name: string; platform: AdPlatform; status: string; currency: string;
  spend_cents: number; revenue_cents: number; impressions: bigint | number; clicks: bigint | number; conversions: number; ctr: number;
  cpa_cents: number; roas: number; daily_budget_cents: number; previous_ctr: number | null; synced_at: Date;
};

export async function listCampaigns(userId: string): Promise<CampaignMetric[]> {
  await ensureAdsTables();
  const rows = await db.$queryRawUnsafe<CampaignRow[]>(
    `SELECT * FROM mansa_ad_campaigns WHERE user_id = $1 ORDER BY spend_cents DESC, updated_at DESC`,
    userId,
  );
  return rows.map((r) => ({
    id: r.id,
    externalId: r.external_id,
    externalBudgetId: r.external_budget_id ?? undefined,
    name: r.name,
    platform: r.platform,
    status: (r.status === "ACTIVE" || r.status === "PAUSED" || r.status === "DRAFT" ? r.status : "UNKNOWN") as CampaignMetric["status"],
    currency: r.currency,
    spend: r.spend_cents / 100,
    revenue: r.revenue_cents / 100,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    conversions: r.conversions,
    ctr: r.ctr,
    cpa: r.cpa_cents / 100,
    roas: r.roas,
    dailyBudget: r.daily_budget_cents / 100,
    previousCtr: r.previous_ctr ?? undefined,
    syncedAt: r.synced_at.toISOString(),
  }));
}

export async function createAttributionEvent(userId: string, input: AttributionEventInput) {
  await ensureAdsTables();
  const id = randomUUID();
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO mansa_ad_attribution_events
       (id,user_id,event_type,campaign_external_id,platform,amount_cents,currency,email,external_event_id,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      id,
      userId,
      input.eventType,
      input.campaignExternalId ?? null,
      input.platform ?? null,
      Math.max(0, Math.round(input.amountCents ?? 0)),
      input.currency ?? "GBP",
      input.email ?? null,
      input.externalEventId ?? null,
      JSON.stringify(input.metadata ?? {}),
    );
  } catch (error) {
    if (input.externalEventId) return { id: input.externalEventId, duplicate: true };
    throw error;
  }
  if (input.eventType === "PURCHASE") await refreshAttributedRevenue(userId);
  return { id, duplicate: false };
}

export async function createDecision(userId: string, action: GrowthAction, approvalRequestId?: string) {
  await ensureAdsTables();
  await db.$executeRawUnsafe(
    `INSERT INTO mansa_ad_decisions
     (id,user_id,campaign_id,campaign_name,platform,action_type,reason,budget_change_pct,requires_approval,approval_request_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO NOTHING`,
    action.id,
    userId,
    action.campaignId,
    action.campaignName,
    action.platform ?? null,
    action.type,
    action.reason,
    action.budgetChangePct ?? null,
    action.requiresApproval,
    approvalRequestId ?? null,
  );
}

export async function markDecisionExecuted(decisionId: string, status = "EXECUTED") {
  await ensureAdsTables();
  await db.$executeRawUnsafe(`UPDATE mansa_ad_decisions SET status=$2, executed_at=NOW() WHERE id=$1`, decisionId, status);
}

export async function listDecisions(userId: string, limit = 20) {
  await ensureAdsTables();
  return db.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM mansa_ad_decisions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,
    userId,
    limit,
  );
}
