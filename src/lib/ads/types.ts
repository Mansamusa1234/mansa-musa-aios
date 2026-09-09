export type AdPlatform = "META" | "GOOGLE" | "TIKTOK";

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DRAFT" | "UNKNOWN";

export type CampaignMetric = {
  id: string;
  externalId?: string;
  externalBudgetId?: string;
  name: string;
  platform: AdPlatform;
  status: CampaignStatus;
  currency?: string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpa: number;
  roas: number;
  dailyBudget: number;
  previousCtr?: number;
  syncedAt?: string;
};

export type ProviderCampaign = CampaignMetric & {
  externalId: string;
};

export type GrowthActionType = "SCALE" | "REDUCE" | "HOLD" | "REFRESH_CREATIVE";

export type GrowthAction = {
  id: string;
  campaignId: string;
  campaignName: string;
  platform?: AdPlatform;
  externalBudgetId?: string;
  type: GrowthActionType;
  reason: string;
  budgetChangePct?: number;
  requiresApproval: boolean;
  createdAt: string;
};

export type CreativeSuggestion = {
  angle: string;
  hook: string;
  body: string;
  cta: string;
};

export type AdsSyncResult = {
  platform: AdPlatform | "STRIPE";
  configured: boolean;
  synced: number;
  error?: string;
};

export type AttributionEventInput = {
  eventType: "PAGE_VIEW" | "LEAD" | "SIGNUP" | "PURCHASE" | "OTHER";
  campaignExternalId?: string | null;
  platform?: AdPlatform | null;
  amountCents?: number;
  currency?: string;
  email?: string | null;
  externalEventId?: string | null;
  metadata?: Record<string, unknown>;
};
