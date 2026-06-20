import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Called monthly to compute recurring commissions on active subscriptions
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversions = await db.affiliateConversion.findMany({
    where: {
      status: "CONVERTED",
      stripeSubscriptionId: { not: null },
    },
    include: {
      affiliate: { select: { recurringRate: true, tier2Rate: true, parentAffiliateId: true } },
    },
  });

  let processed = 0;
  let totalCommissionCents = 0;

  for (const conversion of conversions) {
    try {
      const { requireStripe } = await import("@/lib/stripe");
      const stripe = requireStripe();

      // Find latest paid invoice for this subscription
      const invoices = await stripe.invoices.list({
        subscription: conversion.stripeSubscriptionId!,
        limit: 1,
      });

      const latest = invoices.data[0];
      if (!latest || latest.status !== "paid" || !latest.id) continue;

      // Skip if already recorded
      const exists = await db.affiliateRenewal.findUnique({ where: { invoiceId: latest.id } });
      if (exists) continue;

      const amountCents     = latest.amount_paid;
      const commissionCents = Math.round((amountCents * conversion.affiliate.recurringRate) / 100);

      await db.$transaction(async (tx) => {
        await tx.affiliateRenewal.create({
          data: {
            conversionId:    conversion.id,
            amountCents,
            commissionCents,
            invoiceId:       latest.id!,
          },
        });
        await tx.affiliateConversion.update({
          where: { id: conversion.id },
          data: {
            recurringTotal: { increment: commissionCents },
            lastRenewalAt:  new Date(),
          },
        });

        // Tier-2: pay parent affiliate a cut if they exist
        if (conversion.affiliate.parentAffiliateId && conversion.affiliate.tier2Rate > 0) {
          const tier2Cents = Math.round((amountCents * conversion.affiliate.tier2Rate) / 100);
          await tx.commissionLedger.create({
            data: {
              userId:     conversion.affiliate.parentAffiliateId,
              sourceType: "AFFILIATE",
              amountCents: tier2Cents,
            },
          });
        }
      });

      totalCommissionCents += commissionCents;
      processed++;
    } catch {
      // Skip failed conversions — don't abort the whole batch
    }
  }

  // Recompute tiers for all affiliates
  const affiliates = await db.affiliate.findMany({
    where: { status: "APPROVED" },
    select: { id: true, conversions: { where: { status: "CONVERTED" }, select: { commissionCents: true, recurringTotal: true } } },
  });

  for (const a of affiliates) {
    const total = a.conversions.reduce((s, c) => s + c.commissionCents + c.recurringTotal, 0);
    const tier = total >= 500_00 ? "PLATINUM" : total >= 200_00 ? "GOLD" : total >= 50_00 ? "SILVER" : "BRONZE";
    const rate = tier === "PLATINUM" ? 30 : tier === "GOLD" ? 25 : tier === "SILVER" ? 22 : 20;
    await db.affiliate.update({
      where: { id: a.id },
      data: { tier, commissionRate: rate, recurringRate: rate },
    });
  }

  return NextResponse.json({ processed, totalCommissionCents });
}
