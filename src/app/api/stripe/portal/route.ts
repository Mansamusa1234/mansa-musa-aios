import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await db.subscription.findFirst({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found." }, { status: 404 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: new URL("/portal", process.env.NEXT_PUBLIC_APP_URL || "https://www.mansamusainitiative.com").toString(),
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[stripe/portal] request failed:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Could not open your billing account. Please try again." }, { status: 503 });
  }
}
