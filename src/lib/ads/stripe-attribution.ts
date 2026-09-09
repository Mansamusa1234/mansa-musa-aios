import { getStripe } from "@/lib/stripe";
import { createAttributionEvent } from "./store";
import type { AdsSyncResult } from "./types";

export async function syncStripeAttribution(userId: string, days = 30): Promise<AdsSyncResult> {
  const stripe = getStripe();
  if (!stripe) return { platform: "STRIPE", configured: false, synced: 0 };

  const created = Math.floor((Date.now() - days * 86400000) / 1000);
  let synced = 0;
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: created } });
    for (const session of sessions.data) {
      if (session.payment_status !== "paid") continue;
      const metadata = session.metadata ?? {};
      const campaignExternalId = metadata.campaign_id || metadata.utm_campaign || null;
      if (!campaignExternalId) continue;

      await createAttributionEvent(userId, {
        eventType: "PURCHASE",
        campaignExternalId,
        platform: normalizePlatform(metadata.ad_platform || metadata.utm_source),
        amountCents: session.amount_total ?? 0,
        currency: (session.currency || "gbp").toUpperCase(),
        email: session.customer_details?.email ?? null,
        externalEventId: `stripe_checkout:${session.id}`,
        metadata: {
          stripeCheckoutSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          utmSource: metadata.utm_source,
          utmMedium: metadata.utm_medium,
          utmCampaign: metadata.utm_campaign,
          utmContent: metadata.utm_content,
        },
      });
      synced += 1;
    }
    return { platform: "STRIPE", configured: true, synced };
  } catch (error) {
    return { platform: "STRIPE", configured: true, synced, error: error instanceof Error ? error.message : String(error) };
  }
}

function normalizePlatform(value?: string | null): "META" | "GOOGLE" | "TIKTOK" | null {
  const v = String(value ?? "").toLowerCase();
  if (v.includes("facebook") || v.includes("instagram") || v.includes("meta")) return "META";
  if (v.includes("google")) return "GOOGLE";
  if (v.includes("tiktok")) return "TIKTOK";
  return null;
}
