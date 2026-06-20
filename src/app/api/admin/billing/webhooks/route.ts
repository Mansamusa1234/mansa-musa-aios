import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const BILLING_EVENT_TYPES = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "customer.subscription.trial_will_end",
];

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    const events = await stripe.events.list({
      limit,
      types: BILLING_EVENT_TYPES,
    });

    const rows = events.data.map((e) => ({
      id: e.id,
      type: e.type,
      created: e.created,
      livemode: e.livemode,
      requestId: e.request?.id ?? null,
      // Pull a meaningful ID from common event shapes
      objectId:
        ((e.data.object as unknown as Record<string, unknown>)?.id as string | null) ?? null,
      customerId:
        ((e.data.object as unknown as Record<string, unknown>)?.customer as string | null) ?? null,
    }));

    return NextResponse.json({ events: rows, hasMore: events.has_more });
  } catch (err) {
    console.error("[admin/billing/webhooks]", err);
    return NextResponse.json({ error: "Failed to fetch events from Stripe" }, { status: 500 });
  }
}
