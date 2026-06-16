import { auth } from "@/lib/auth";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await checkRateLimit(limiters.checkout, session.user.id);
  if (limited) return limited;

  const { priceId } = await req.json();
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  const customerId = await getOrCreateStripeCustomer(
    session.user.id,
    session.user.email!
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: { userId: session.user.id },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
