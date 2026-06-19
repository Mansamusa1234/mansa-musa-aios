import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { active } = await req.json();
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const updated = await stripe.promotionCodes.update(id, { active: !!active });
  return NextResponse.json({ success: true, active: updated.active });
}
