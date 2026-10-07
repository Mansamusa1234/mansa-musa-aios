import { auth } from "@/lib/auth";
import { subscriptionPeriod } from "@/lib/stripePayload";
import { requireStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeSubscriptionId: true, status: true, cancelAtPeriodEnd: true },
  });

  if (!subscription?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  if (subscription.cancelAtPeriodEnd) {
    return NextResponse.json({ error: "Subscription is already scheduled for cancellation" }, { status: 400 });
  }

  try {
    const stripe = requireStripe();
    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    const period = subscriptionPeriod(updated);

    await db.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(period.end * 1000),
      },
    });

    return NextResponse.json({ ok: true, endsAt: period.end });
  } catch (err) {
    console.error("[stripe/cancel] error:", (err as Error)?.message);
    return NextResponse.json({ error: "Could not cancel subscription. Please try again." }, { status: 500 });
  }
}
