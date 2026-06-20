import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [affiliates, payoutRequests] = await Promise.all([
    db.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        conversions: { select: { commissionCents: true, recurringTotal: true, status: true } },
        _count: { select: { clickLogs: true } },
      },
    }),
    db.affiliatePayoutRequest.findMany({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      include: {
        affiliate: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
  ]);

  const rows = affiliates.map((a) => ({
    id:             a.id,
    userId:         a.userId,
    userName:       a.user.name,
    userEmail:      a.user.email,
    code:           a.code,
    couponCode:     a.couponCode,
    tier:           a.tier,
    status:         a.status,
    commissionRate: a.commissionRate,
    clicks:         a.clicks,
    conversions:    a.conversions.filter((c) => c.status === "CONVERTED").length,
    totalEarnedCents: a.conversions.reduce((s, c) => s + c.commissionCents + c.recurringTotal, 0),
    createdAt:      a.createdAt,
  }));

  return NextResponse.json({ affiliates: rows, payoutRequests });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    affiliateId?: string;
    payoutId?: string;
    action: string;
    commissionRate?: number;
    status?: string;
    adminNote?: string;
  };

  if (body.payoutId) {
    const payout = await db.affiliatePayoutRequest.update({
      where: { id: body.payoutId },
      data: {
        status:      body.action === "approve" ? "APPROVED" : body.action === "pay" ? "PAID" : "REJECTED",
        adminNote:   body.adminNote ?? null,
        processedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, payout });
  }

  if (body.affiliateId) {
    const data: Record<string, unknown> = {};
    if (body.status)         data.status         = body.status;
    if (body.commissionRate) data.commissionRate  = body.commissionRate;
    const updated = await db.affiliate.update({ where: { id: body.affiliateId }, data });
    return NextResponse.json({ success: true, affiliate: updated });
  }

  return NextResponse.json({ error: "Missing affiliateId or payoutId" }, { status: 400 });
}
