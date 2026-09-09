export type AdPlatform = "META" | "GOOGLE" | "TIKTOK";

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DRAFT";

export type CampaignMetric = {
  id: string;
  name: string;
  platform: AdPlatform;
  status: CampaignStatus;
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
};

export type GrowthActionType = "SCALE" | "REDUCE" | "HOLD" | "REFRESH_CREATIVE";

export type GrowthAction = {
  id: string;
  campaignId: string;
  campaignName: string;
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
