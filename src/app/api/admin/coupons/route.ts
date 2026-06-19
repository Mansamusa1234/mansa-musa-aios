import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const promotionCodes = await stripe.promotionCodes.list({ limit: 100, expand: ["data.coupon"] });

  return NextResponse.json(
    promotionCodes.data.map((pc) => ({
      id: pc.id,
      code: pc.code,
      active: pc.active,
      timesRedeemed: pc.times_redeemed,
      maxRedemptions: pc.max_redemptions,
      expiresAt: pc.expires_at,
      percentOff: pc.coupon.percent_off,
      amountOff: pc.coupon.amount_off,
      duration: pc.coupon.duration,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const { code, percentOff, durationMonths, maxRedemptions, expiresInDays } = await req.json();

  if (!code || typeof code !== "string" || !/^[A-Z0-9_-]{3,40}$/i.test(code)) {
    return NextResponse.json({ error: "Code must be 3-40 letters/numbers/dashes." }, { status: 400 });
  }
  const pct = Number(percentOff);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
    return NextResponse.json({ error: "Percent off must be between 1 and 100." }, { status: 400 });
  }

  try {
    const coupon = await stripe.coupons.create({
      percent_off: pct,
      duration: durationMonths ? "repeating" : "once",
      duration_in_months: durationMonths ? Number(durationMonths) : undefined,
      name: code.toUpperCase(),
    });

    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.toUpperCase(),
      max_redemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      expires_at: expiresInDays ? Math.floor(Date.now() / 1000) + Number(expiresInDays) * 86400 : undefined,
    });

    return NextResponse.json({ success: true, id: promotionCode.id, code: promotionCode.code }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create promo code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
