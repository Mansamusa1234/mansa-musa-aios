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
    select: { stripeSubscriptionId: true, cancelAtPeriodEnd: true },
  });

  if (!subscription?.stripeSubscriptionId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  if (!subscription.cancelAtPeriodEnd) {
    return NextResponse.json({ error: "Subscription is not scheduled for cancellation" }, { status: 400 });
  }

  try {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await db.subscription.update({
      where: { userId: session.user.id },
      data: { cancelAtPeriodEnd: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[stripe/reactivate] error:", (err as Error)?.message);
    return NextResponse.json({ error: "Could not reactivate subscription. Please try again." }, { status: 500 });
  }
}
