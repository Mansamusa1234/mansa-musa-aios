import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recommendGrowthAction } from "@/lib/ads/optimizer";
import { createDecision, listCampaigns } from "@/lib/ads/store";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await listCampaigns(session.user.id);
  const actions = campaigns.map(recommendGrowthAction);

  for (const action of actions) {
    let approvalRequestId: string | undefined;
    if (action.requiresApproval && action.budgetChangePct !== undefined) {
      const approval = await db.approvalRequest.create({
        data: {
          userId: session.user.id,
          agentId: "paid-ads-growth-agent",
          action: "AD_BUDGET_CHANGE",
          payload: JSON.stringify({
            decisionId: action.id,
            campaignId: action.campaignId,
            campaignName: action.campaignName,
            platform: action.platform,
            externalBudgetId: action.externalBudgetId,
            budgetChangePct: action.budgetChangePct,
          }),
        },
      });
      approvalRequestId = approval.id;
    }
    await createDecision(session.user.id, action, approvalRequestId);
  }

  return NextResponse.json({ ok: true, actions });
}
