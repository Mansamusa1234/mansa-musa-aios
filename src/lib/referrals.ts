import crypto from "crypto";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

const REFERRAL_REWARD_PERCENT = 10;

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex");
}

/** Returns the user's referral code, generating and persisting one on first use. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    try {
      await db.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      // unique collision (astronomically unlikely) — retry with a new code
    }
  }
  throw new Error("Failed to generate a unique referral code");
}

/** Best-effort: attribute a new signup to whoever owns this referral code. Never throws. */
export async function recordReferralSignup(refCode: string | undefined | null, newUserId: string): Promise<void> {
  if (!refCode) return;
  try {
    const referrer = await db.user.findUnique({ where: { referralCode: refCode }, select: { id: true } });
    if (!referrer || referrer.id === newUserId) return;

    await db.referral.create({
      data: { referrerId: referrer.id, referredUserId: newUserId },
    });
  } catch (err) {
    console.error("[referrals] recordReferralSignup failed:", err);
  }
}

/** Best-effort: attribute a new signup to whoever owns this affiliate code. Never throws. */
export async function recordAffiliateSignup(affCode: string | undefined | null, newUserId: string): Promise<void> {
  if (!affCode) return;
  try {
    const affiliate = await db.affiliate.findUnique({ where: { code: affCode }, select: { id: true, userId: true } });
    if (!affiliate || affiliate.userId === newUserId) return;

    await db.affiliateConversion.create({
      data: { affiliateId: affiliate.id, referredUserId: newUserId },
    });
  } catch (err) {
    console.error("[referrals] recordAffiliateSignup failed:", err);
  }
}

/** Best-effort: when a referred/affiliate-attributed user's first paid subscription activates, mark the conversion and compute the (tracking-only — not auto-paid) reward. Never throws. */
export async function recordConversion(userId: string, priceId: string | null | undefined): Promise<void> {
  try {
    const planPrice = PLANS.find((p) => p.priceId === priceId)?.price ?? 0;
    if (planPrice <= 0) return;
    const priceCents = Math.round(planPrice * 100);

    const referral = await db.referral.findUnique({ where: { referredUserId: userId } });
    if (referral && referral.status !== "CONVERTED") {
      await db.referral.update({
        where: { id: referral.id },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
          rewardCents: Math.round((priceCents * REFERRAL_REWARD_PERCENT) / 100),
        },
      });
    }

    const conversion = await db.affiliateConversion.findUnique({
      where: { referredUserId: userId },
      include: { affiliate: { select: { commissionRate: true } } },
    });
    if (conversion && conversion.status !== "CONVERTED") {
      await db.affiliateConversion.update({
        where: { id: conversion.id },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
          commissionCents: Math.round((priceCents * conversion.affiliate.commissionRate) / 100),
        },
      });
    }
  } catch (err) {
    console.error("[referrals] recordConversion failed:", err);
  }
}
