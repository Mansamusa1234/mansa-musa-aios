import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MIN_PAYOUT_CENTS = 5000; // £50 minimum

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const affiliate = await db.affiliate.findUnique({
    where: { userId },
    include: {
      conversions: {
        where: { status: "CONVERTED" },
        select: { commissionCents: true },
      },
    },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "No affiliate account found" }, { status: 404 });
  }

  const totalEarnings = affiliate.conversions.reduce((s, c) => s + c.commissionCents, 0);

  if (totalEarnings < MIN_PAYOUT_CENTS) {
    return NextResponse.json(
      { error: `Minimum payout is £${MIN_PAYOUT_CENTS / 100}. You have £${(totalEarnings / 100).toFixed(2)}.` },
      { status: 400 }
    );
  }

  await db.supportTicket.create({
    data: {
      userId,
      subject: `Payout Request — Affiliate ${affiliate.code}`,
      body: [
        `Affiliate payout request submitted.`,
        ``,
        `Affiliate code: ${affiliate.code}`,
        `User ID: ${userId}`,
        `Total earned: £${(totalEarnings / 100).toFixed(2)}`,
        `Conversions: ${affiliate.conversions.length}`,
      ].join("\n"),
      priority: "MEDIUM",
      status: "OPEN",
    },
  });

  return NextResponse.json({ success: true });
}
