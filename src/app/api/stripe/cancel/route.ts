import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
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
    const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await db.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(updated.current_period_end * 1000),
      },
    });

    return NextResponse.json({ ok: true, endsAt: updated.current_period_end });
  } catch (err) {
    console.error("[stripe/cancel] error:", (err as Error)?.message);
    return NextResponse.json({ error: "Could not cancel subscription. Please try again." }, { status: 500 });
  }
}
