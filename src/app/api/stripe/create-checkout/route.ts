import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { requireStripe, getOrCreateStripeCustomer, findPlanByPriceId } from "@/lib/stripe";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.checkout, session.user.id);
  if (limited) return limited;

  const payload = await req.json().catch(() => null) as { priceId?: unknown } | null;
  const priceId = payload?.priceId;
  if (typeof priceId !== "string" || !priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  if (!priceId.startsWith("price_")) {
    return NextResponse.json({ error: "Invalid price ID — check STRIPE_PRICE_* env vars in Vercel." }, { status: 400 });
  }
  const plan = findPlanByPriceId(priceId);
  if (!plan) {
    return NextResponse.json({ error: "This price is not configured for sale." }, { status: 400 });
  }

  try {
    const stripe = requireStripe();
    const existing = await db.subscription.findUnique({ where: { userId: session.user.id } });
    if (existing?.stripeSubscriptionId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(existing.status)) {
      return NextResponse.json({ error: "You already have a subscription. Manage or change your plan from Billing.", billingUrl: "/billing" }, { status: 409 });
    }
    const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email!);
    // Check Stripe as well: webhooks can lag behind a completed checkout.
    const existingSubscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
    if (existingSubscriptions.data.some((subscription) => !["canceled", "incomplete_expired"].includes(subscription.status))) {
      return NextResponse.json({ error: "An existing subscription is already associated with your billing account. Open Billing to manage it.", billingUrl: "/billing" }, { status: 409 });
    }

    const openCheckouts = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 });
    const pendingCheckouts = openCheckouts.data.filter((checkout) => checkout.mode === "subscription");
    const matchingCheckout = pendingCheckouts.find((checkout) => checkout.metadata?.planId === plan.id &&
      checkout.metadata?.billingInterval === (plan.annualPriceId === priceId ? "annual" : "monthly") && checkout.url);
    // Explicit selection of a different plan replaces only this customer's unfinished
    // subscription checkouts. Expiration failure must prevent a new charge path.
    for (const pendingCheckout of pendingCheckouts) {
      if (pendingCheckout.id === matchingCheckout?.id) continue;
      await stripe.checkout.sessions.expire(pendingCheckout.id);
    }
    if (matchingCheckout?.url) return NextResponse.json({ url: matchingCheckout.url });

    // Read 90-day affiliate tracking cookie
    const cookieStore = await cookies();
    const affCode = cookieStore.get("mm_aff")?.value ?? null;
    const metadata: Record<string, string> = {
      userId: session.user.id,
      planId: plan.id,
      billingInterval: plan.annualPriceId === priceId ? "annual" : "monthly",
    };
    if (affCode) metadata.affiliateCode = affCode;

    // Apply affiliate discount coupon if the code matches
    let discounts: { coupon: string }[] | undefined;
    if (affCode) {
      const affiliate = await db.affiliate.findUnique({
        where: { code: affCode },
        select: { couponCode: true, stripeCouponId: true },
      });
      if (affiliate?.stripeCouponId) {
        discounts = [{ coupon: affiliate.stripeCouponId }];
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata,
      allow_promotion_codes: !discounts,
      ...(discounts ? { discounts } : {}),
    }, {
      // Repeated clicks for the same plan reuse one checkout during this short window.
      idempotencyKey: `checkout-${session.user.id}-${priceId}-${Math.floor(Date.now() / (15 * 60_000))}-${createHash("sha256").update(pendingCheckouts.map((checkout) => checkout.id).sort().join(",") || "new").digest("hex").slice(0, 16)}`,
    });

    if (!checkoutSession.url) throw new Error("Stripe did not return a checkout URL");

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const msg = (err as Error)?.message ?? "Unknown error";
    console.error("[stripe/create-checkout] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
