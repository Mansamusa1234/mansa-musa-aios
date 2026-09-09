import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncProviderCampaigns } from "@/lib/ads/providers";
import { upsertCampaigns, listCampaigns } from "@/lib/ads/store";
import { syncStripeAttribution } from "@/lib/ads/stripe-attribution";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaigns, results } = await syncProviderCampaigns();
  if (campaigns.length) await upsertCampaigns(session.user.id, campaigns);
  const stripe = await syncStripeAttribution(session.user.id);
  const stored = await listCampaigns(session.user.id);

  return NextResponse.json({
    ok: true,
    results: [...results, stripe],
    campaigns: stored,
  });
}
