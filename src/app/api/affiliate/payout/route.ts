import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MIN_PAYOUT_CENTS = 5000; // £50

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { method?: string; notes?: string };

  const affiliate = await db.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      conversions: {
        where: { status: "CONVERTED" },
        select: { commissionCents: true, recurringTotal: true },
      },
      payoutRequests: {
        where: { status: { in: ["PENDING", "APPROVED"] } },
      },
    },
  });

  if (!affiliate) return NextResponse.json({ error: "No affiliate account" }, { status: 404 });

  if (affiliate.payoutRequests.length > 0) {
    return NextResponse.json({ error: "You already have a pending payout request." }, { status: 400 });
  }

  const totalEarned = affiliate.conversions.reduce(
    (s, c) => s + c.commissionCents + c.recurringTotal, 0
  );

  // Subtract already-paid amounts
  const paidOut = await db.affiliatePayoutRequest.aggregate({
    where: { affiliateId: affiliate.id, status: "PAID" },
    _sum: { amountCents: true },
  });
  const available = totalEarned - (paidOut._sum.amountCents ?? 0);

  if (available < MIN_PAYOUT_CENTS) {
    return NextResponse.json(
      { error: `Minimum payout is £${MIN_PAYOUT_CENTS / 100}. Available: £${(available / 100).toFixed(2)}.` },
      { status: 400 }
    );
  }

  const request = await db.affiliatePayoutRequest.create({
    data: {
      affiliateId: affiliate.id,
      amountCents: available,
      method: body.method ?? "bank",
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json({ success: true, request });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const affiliate = await db.affiliate.findUnique({ where: { userId: session.user.id } });
  if (!affiliate) return NextResponse.json({ requests: [] });

  const requests = await db.affiliatePayoutRequest.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
