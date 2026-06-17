import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const affiliates = await db.affiliate.findMany({
    where: { status: "APPROVED" },
    select: {
      userId: true,
      code: true,
      clicks: true,
      conversions: {
        select: { commissionCents: true, status: true },
      },
    },
  });

  const ranked = affiliates
    .map((a) => ({
      userId: a.userId,
      code: a.code,
      clicks: a.clicks,
      totalEarnings: a.conversions.reduce((s, c) => s + c.commissionCents, 0),
      conversions: a.conversions.filter((c) => c.status === "CONVERTED").length,
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings);

  const currentUserId = session.user.id;
  const currentRankIndex = ranked.findIndex((r) => r.userId === currentUserId);

  const leaderboard = ranked.slice(0, 10).map((r, i) => ({
    rank: i + 1,
    maskedCode: r.code.slice(0, 3) + "•••",
    totalEarningsCents: r.totalEarnings,
    conversions: r.conversions,
    clicks: r.clicks,
    isCurrentUser: r.userId === currentUserId,
  }));

  return NextResponse.json({
    leaderboard,
    currentUserRank: currentRankIndex >= 0 ? currentRankIndex + 1 : null,
    totalAffiliates: ranked.length,
  });
}
