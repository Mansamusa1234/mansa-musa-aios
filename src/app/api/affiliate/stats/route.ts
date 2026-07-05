import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const affiliate = await db.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      conversions: {
        include: {
          renewals: true,
          ledgerEntry: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      clickLogs: {
        orderBy: { createdAt: "desc" },
        take: 500,
      },
      payoutRequests: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!affiliate) return NextResponse.json({ affiliate: null });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

  const clicksTotal  = affiliate.clicks;
  const clicks30d    = affiliate.clickLogs.filter((c) => c.createdAt >= thirtyDaysAgo).length;
  const clicks7d     = affiliate.clickLogs.filter((c) => c.createdAt >= sevenDaysAgo).length;

  const conversions     = affiliate.conversions.filter((c) => c.status === "CONVERTED");
  const conversionRate  = clicksTotal > 0 ? (conversions.length / clicksTotal) * 100 : 0;

  const oneTimeTotal    = affiliate.conversions.reduce((s, c) => s + c.commissionCents, 0);
  const recurringTotal  = affiliate.conversions.reduce((s, c) => s + c.recurringTotal, 0);
  const totalEarned     = oneTimeTotal + recurringTotal;

  const clicksByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    clicksByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const click of affiliate.clickLogs) {
    const day = click.createdAt.toISOString().slice(0, 10);
    if (day in clicksByDay) clicksByDay[day]++;
  }

  const renewals = affiliate.conversions.flatMap((c) =>
    c.renewals.map((r) => ({
      id: r.id,
      amountCents: r.amountCents,
      commissionCents: r.commissionCents,
      paidAt: r.createdAt,
    }))
  ).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  return NextResponse.json({
    affiliate: {
      id: affiliate.id,
      code: affiliate.code,
      tier: affiliate.tier,
      commissionRate: affiliate.commissionRate,
      recurringRate: affiliate.recurringRate,
      couponCode: affiliate.couponCode,
      socialHandle: affiliate.socialHandle,
      paypalEmail: affiliate.paypalEmail,
      status: affiliate.status,
    },
    stats: {
      clicksTotal,
      clicks30d,
      clicks7d,
      conversionsTotal: conversions.length,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalEarnedCents: totalEarned,
      oneTimeCents: oneTimeTotal,
      recurringCents: recurringTotal,
    },
    clickChart: Object.entries(clicksByDay).map(([date, count]) => ({ date, count })),
    conversions: affiliate.conversions.map((c) => ({
      id: c.id,
      status: c.status,
      commissionCents: c.commissionCents,
      recurringTotal: c.recurringTotal,
      createdAt: c.createdAt,
      convertedAt: c.convertedAt,
      lastRenewalAt: c.lastRenewalAt,
      renewalCount: c.renewals.length,
      payoutStatus: c.ledgerEntry?.status ?? null,
    })),
    renewals: renewals.slice(0, 20),
    payoutRequests: affiliate.payoutRequests,
  });
}
