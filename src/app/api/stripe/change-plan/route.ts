import { auth } from "@/lib/auth";
import { requireStripe, PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  const validPriceIds = PLANS.map((p) => p.priceId).filter(Boolean);
  if (!validPriceIds.includes(priceId)) {
    return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeSubscriptionId: true, stripePriceId: true, status: true },
  });

  if (!subscription?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  if (!["ACTIVE", "TRIALING"].includes(subscription.status)) {
    return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
  }

  if (subscription.stripePriceId === priceId) {
    return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
  }

  try {
    const stripe = requireStripe();
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    const itemId = stripeSub.items.data[0].id;

    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
    });

    await db.subscription.update({
      where: { userId: session.user.id },
      data: {
        stripePriceId: updated.items.data[0].price.id,
        status: "ACTIVE",
        currentPeriodStart: new Date(updated.current_period_start * 1000),
        currentPeriodEnd: new Date(updated.current_period_end * 1000),
        cancelAtPeriodEnd: updated.cancel_at_period_end,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stripe/change-plan] error:", (err as Error)?.message);
    return NextResponse.json({ error: "Could not change plan. Please try again." }, { status: 500 });
  }
}
