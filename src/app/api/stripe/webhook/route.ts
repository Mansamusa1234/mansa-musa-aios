import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);

      await db.subscription.upsert({
        where: { stripeCustomerId: session.customer as string },
        create: {
          userId: session.metadata!.userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0].price.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        update: {
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0].price.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const statusMap: Record<string, string> = {
        active: "ACTIVE",
        canceled: "CANCELED",
        past_due: "PAST_DUE",
        trialing: "TRIALING",
        unpaid: "PAST_DUE",
      };

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: (statusMap[sub.status] ?? "INACTIVE") as never,
          stripePriceId: sub.items.data[0].price.id,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
