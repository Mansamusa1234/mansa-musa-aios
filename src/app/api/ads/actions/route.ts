import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeBudgetChange } from "@/lib/ads/providers";
import { listCampaigns, markDecisionExecuted } from "@/lib/ads/store";
import type { AdPlatform } from "@/lib/ads/types";

const schema = z.object({
  approvalId: z.string().min(1),
  approve: z.boolean(),
  note: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const approval = await db.approvalRequest.findUnique({ where: { id: parsed.data.approvalId } });
  if (!approval || approval.userId !== session.user.id) return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
  if (approval.status !== "PENDING") return NextResponse.json({ error: `Approval is already ${approval.status}` }, { status: 409 });

  if (!parsed.data.approve) {
    await db.approvalRequest.update({
      where: { id: approval.id },
      data: { status: "REJECTED", reviewedBy: session.user.id, reviewNote: parsed.data.note, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  let payload: any;
  try {
    payload = JSON.parse(approval.payload);
  } catch {
    return NextResponse.json({ error: "Invalid approval payload" }, { status: 400 });
  }

  if (approval.action !== "AD_BUDGET_CHANGE") return NextResponse.json({ error: "Unsupported approval action" }, { status: 400 });
  if (!payload.platform || !payload.externalBudgetId || typeof payload.budgetChangePct !== "number") {
    return NextResponse.json({ error: "This campaign does not have a writable provider budget identifier yet" }, { status: 400 });
  }

  const campaigns = await listCampaigns(session.user.id);
  const campaign = campaigns.find((c) => c.id === payload.campaignId);
  if (!campaign) return NextResponse.json({ error: "Campaign snapshot not found. Sync ads first." }, { status: 404 });
  if (campaign.dailyBudget <= 0) return NextResponse.json({ error: "Provider did not return a current daily budget, so a safe percentage change cannot be calculated." }, { status: 400 });

  try {
    const result = await executeBudgetChange({
      platform: payload.platform as AdPlatform,
      externalBudgetId: payload.externalBudgetId,
      currentBudgetCents: Math.round(campaign.dailyBudget * 100),
      changePct: payload.budgetChangePct,
    });
    await db.approvalRequest.update({
      where: { id: approval.id },
      data: { status: "APPROVED", reviewedBy: session.user.id, reviewNote: parsed.data.note, reviewedAt: new Date() },
    });
    if (payload.decisionId) await markDecisionExecuted(payload.decisionId);
    return NextResponse.json({ ok: true, status: "EXECUTED", nextBudget: result.nextBudgetCents / 100 });
  } catch (error) {
    await db.approvalRequest.update({
      where: { id: approval.id },
      data: { status: "FAILED", reviewedBy: session.user.id, reviewNote: error instanceof Error ? error.message : String(error), reviewedAt: new Date() },
    });
    if (payload.decisionId) await markDecisionExecuted(payload.decisionId, "FAILED");
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
