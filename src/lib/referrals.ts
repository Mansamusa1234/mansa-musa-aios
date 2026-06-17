import crypto from "crypto";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import { sendEmail, referralConvertedEmailHtml, affiliateConversionEmailHtml } from "@/lib/email";

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

    await Promise.all([
      db.referral.create({ data: { referrerId: referrer.id, referredUserId: newUserId } }),
      db.user.update({ where: { id: newUserId }, data: { referredByUserId: referrer.id } }),
    ]);
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

/**
 * Best-effort: when a referred/affiliate-attributed user's first paid subscription activates,
 * mark the conversion and open a PENDING commission ledger entry for it.
 *
 * This never pays anyone automatically — a ledger entry only becomes payable once an admin
 * approves it via /admin/commissions, and is only ever marked PAID by an explicit admin action.
 * Never throws.
 */
export async function recordConversion(userId: string, priceId: string | null | undefined): Promise<void> {
  try {
    const planPrice = PLANS.find((p) => p.priceId === priceId)?.price ?? 0;
    if (planPrice <= 0) return;
    const priceCents = Math.round(planPrice * 100);

    const referral = await db.referral.findUnique({ where: { referredUserId: userId } });
    if (referral && referral.status !== "CONVERTED") {
      const rewardCents = Math.round((priceCents * REFERRAL_REWARD_PERCENT) / 100);
      await db.referral.update({
        where: { id: referral.id },
        data: { status: "CONVERTED", convertedAt: new Date(), rewardCents },
      });
      await db.commissionLedger.create({
        data: {
          userId: referral.referrerId,
          sourceType: "REFERRAL",
          referralId: referral.id,
          amountCents: rewardCents,
        },
      });
      // Notify referrer — best-effort
      try {
        const referrer = await db.user.findUnique({
          where: { id: referral.referrerId },
          select: { email: true, name: true },
        });
        if (referrer) {
          await sendEmail(
            referrer.email,
            "You earned a referral reward — MansaMusaAI",
            referralConvertedEmailHtml({
              name: referrer.name ?? "there",
              rewardGbp: (rewardCents / 100).toFixed(2),
            })
          );
        }
      } catch (emailErr) {
        console.error("[referrals] referral converted email failed:", emailErr);
      }
    }

    const conversion = await db.affiliateConversion.findUnique({
      where: { referredUserId: userId },
      include: { affiliate: { select: { id: true, userId: true, commissionRate: true } } },
    });
    if (conversion && conversion.status !== "CONVERTED") {
      const commissionCents = Math.round((priceCents * conversion.affiliate.commissionRate) / 100);
      await db.affiliateConversion.update({
        where: { id: conversion.id },
        data: { status: "CONVERTED", convertedAt: new Date(), commissionCents },
      });
      await db.commissionLedger.create({
        data: {
          userId: conversion.affiliate.userId,
          sourceType: "AFFILIATE",
          affiliateConversionId: conversion.id,
          amountCents: commissionCents,
        },
      });
      // Notify affiliate owner — best-effort
      try {
        const affiliateUser = await db.user.findUnique({
          where: { id: conversion.affiliate.userId },
          select: { email: true, name: true },
        });
        if (affiliateUser) {
          await sendEmail(
            affiliateUser.email,
            "New affiliate commission earned — MansaMusaAI",
            affiliateConversionEmailHtml({
              name: affiliateUser.name ?? "there",
              commissionGbp: (commissionCents / 100).toFixed(2),
            })
          );
        }
      } catch (emailErr) {
        console.error("[referrals] affiliate conversion email failed:", emailErr);
      }
    }
  } catch (err) {
    console.error("[referrals] recordConversion failed:", err);
  }
}
