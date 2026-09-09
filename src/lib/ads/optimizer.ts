import type { CampaignMetric, CreativeSuggestion, GrowthAction } from "./types";

export function recommendGrowthAction(campaign: CampaignMetric): GrowthAction {
  const decliningCtr = campaign.previousCtr !== undefined && campaign.ctr < campaign.previousCtr * 0.8;
  const strongRoas = campaign.roas >= 3;
  const weakRoas = campaign.roas > 0 && campaign.roas < 1.5;
  const avgOrderValue = campaign.conversions > 0 ? campaign.revenue / campaign.conversions : 0;
  const expensive = campaign.cpa >= Math.max(50, avgOrderValue * 0.55);
  const base = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    platform: campaign.platform,
    externalBudgetId: campaign.externalBudgetId,
    createdAt: new Date().toISOString(),
  };

  if (strongRoas && !decliningCtr) {
    return {
      ...base,
      id: `act-${campaign.id}-scale`,
      type: "SCALE",
      reason: `ROAS is ${campaign.roas.toFixed(2)}x with stable engagement. Increase budget gradually to protect efficiency.`,
      budgetChangePct: 15,
      requiresApproval: true,
    };
  }

  if (decliningCtr || expensive) {
    return {
      ...base,
      id: `act-${campaign.id}-creative`,
      type: "REFRESH_CREATIVE",
      reason: decliningCtr
        ? "CTR has materially declined versus the previous period, indicating likely creative fatigue."
        : "CPA is high relative to current conversion value. Test a new angle before increasing spend.",
      requiresApproval: false,
    };
  }

  if (weakRoas) {
    return {
      ...base,
      id: `act-${campaign.id}-reduce`,
      type: "REDUCE",
      reason: `ROAS is only ${campaign.roas.toFixed(2)}x. Reduce exposure while a better audience or creative is tested.`,
      budgetChangePct: -20,
      requiresApproval: true,
    };
  }

  return {
    ...base,
    id: `act-${campaign.id}-hold`,
    type: "HOLD",
    reason: "Performance is mixed but not weak enough to justify a budget change yet. Keep collecting data.",
    requiresApproval: false,
  };
}

export function generateCreativeSuggestions(brand: string, offer: string): CreativeSuggestion[] {
  return [
    {
      angle: "Outcome",
      hook: `What if ${brand} could turn your next campaign into measurable growth?`,
      body: `${offer}. Focus on the result customers actually care about and remove unnecessary friction from the decision.`,
      cta: "See how it works",
    },
    {
      angle: "Pain point",
      hook: "Still spending on ads without knowing what actually made the sale?",
      body: `${brand} connects campaign performance to business outcomes so you can cut waste and double down on what converts.`,
      cta: "Stop wasting spend",
    },
    {
      angle: "Proof-led",
      hook: "Better ads start with better feedback loops.",
      body: `${offer}. Test clear hypotheses, measure them against revenue, and use each result to improve the next creative.`,
      cta: "Build the next winner",
    },
  ];
}
