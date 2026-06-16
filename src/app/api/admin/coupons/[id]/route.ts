import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { active } = await req.json();

  const updated = await stripe.promotionCodes.update(id, { active: !!active });
  return NextResponse.json({ success: true, active: updated.active });
}
