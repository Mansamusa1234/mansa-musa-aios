import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function generateCode() {
  return crypto.randomBytes(4).toString("hex");
}

function generateCouponCode(userId: string, attempt: number) {
  const base = "MM" + userId.slice(-4).toUpperCase();
  return attempt > 0 ? base + attempt : base;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.affiliate.findUnique({ where: { userId: session.user.id } });
  if (existing) return NextResponse.json({ code: existing.code, couponCode: existing.couponCode });

  for (let attempt = 0; attempt < 5; attempt++) {
    const code       = generateCode();
    const couponCode = generateCouponCode(session.user.id, attempt);

    let stripeCouponId: string | null = null;
    try {
      const { requireStripe } = await import("@/lib/stripe");
      const stripe = requireStripe();
      const coupon = await stripe.coupons.create({
        id:                  couponCode,
        percent_off:         10,
        duration:            "repeating",
        duration_in_months:  3,
        name:                `MansaMusaAI — 10% off (${code})`,
        metadata:            { affiliateCode: code, userId: session.user.id },
      });
      stripeCouponId = coupon.id;
    } catch {
      // Stripe not configured — proceed without coupon
    }

    try {
      const affiliate = await db.affiliate.create({
        data: { userId: session.user.id, code, couponCode, stripeCouponId },
      });
      return NextResponse.json({ code: affiliate.code, couponCode: affiliate.couponCode });
    } catch {
      // collision — retry
    }
  }

  return NextResponse.json({ error: "Failed to create affiliate account" }, { status: 500 });
}
