import { auth } from "@/lib/auth";
import { requireStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.checkout, session.user.id);
  if (limited) return limited;

  const { priceId } = await req.json() as { priceId?: string };
  if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  if (!priceId.startsWith("price_")) {
    return NextResponse.json({ error: "Invalid price ID — check STRIPE_PRICE_* env vars in Vercel." }, { status: 400 });
  }

  try {
    const stripe = requireStripe();
    const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email!);

    // Read 90-day affiliate tracking cookie
    const cookieStore = await cookies();
    const affCode = cookieStore.get("mm_aff")?.value ?? null;
    const metadata: Record<string, string> = { userId: session.user.id };
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
    });

    if (!checkoutSession.url) throw new Error("Stripe did not return a checkout URL");

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const msg = (err as Error)?.message ?? "Unknown error";
    console.error("[stripe/create-checkout] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
