import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AffiliateContent from "./AffiliateContent";

export const metadata: Metadata = {
  title: "Affiliate Programme | MansaMusaAI",
  description: "Earn commission promoting MansaMusaAI to your audience.",
};

export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const session = await auth();
  const userId  = session!.user.id;

  // Fetch affiliate + all approved affiliates for leaderboard in parallel
  const [affiliate, allAffiliates] = await Promise.all([
    db.affiliate.findUnique({
      where: { userId },
      include: {
        conversions: {
          orderBy: { createdAt: "desc" },
          include: { ledgerEntry: { select: { status: true } } },
        },
      },
    }),
    db.affiliate.findMany({
      where: { status: "APPROVED" },
      select: {
        userId:  true,
        code:    true,
        clicks:  true,
        conversions: {
          select: { commissionCents: true, status: true },
        },
      },
    }),
  ]);

  // Build leaderboard (sorted by total commission earned)
  const ranked = allAffiliates
    .map((a) => ({
      userId:        a.userId,
      code:          a.code,
      clicks:        a.clicks,
      totalEarnings: a.conversions.reduce((s, c) => s + c.commissionCents, 0),
      conversions:   a.conversions.filter((c) => c.status === "CONVERTED").length,
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings);

  const currentRankIndex = ranked.findIndex((r) => r.userId === userId);

  const leaderboard = ranked.slice(0, 10).map((r, i) => ({
    rank:               i + 1,
    maskedCode:         r.code.slice(0, 3) + "•••",
    totalEarningsCents: r.totalEarnings,
    conversions:        r.conversions,
    clicks:             r.clicks,
    isCurrentUser:      r.userId === userId,
  }));

  if (!affiliate) {
    return (
      <AffiliateContent
        affiliate={null}
        conversions={[]}
        totalCommissionCents={0}
        leaderboard={leaderboard}
        currentUserRank={null}
      />
    );
  }

  const totalCommissionCents = affiliate.conversions.reduce((sum, c) => sum + c.commissionCents, 0);

  return (
    <AffiliateContent
      affiliate={{
        code:          affiliate.code,
        clicks:        affiliate.clicks,
        commissionRate: affiliate.commissionRate,
        couponCode:    affiliate.couponCode    ?? null,
        socialHandle:  affiliate.socialHandle  ?? null,
      }}
      conversions={affiliate.conversions.map((c) => ({
        id:             c.id,
        status:         c.status,
        commissionCents: c.commissionCents,
        createdAt:      c.createdAt,
        payoutStatus:   c.ledgerEntry?.status ?? null,
      }))}
      totalCommissionCents={totalCommissionCents}
      leaderboard={leaderboard}
      currentUserRank={currentRankIndex >= 0 ? currentRankIndex + 1 : null}
    />
  );
}
