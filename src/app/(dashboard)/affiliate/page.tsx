import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AffiliateContent from "./AffiliateContent";

export const metadata: Metadata = {
  title: "Affiliate Programme | MansaMusaAI",
  description: "Earn recurring commission promoting MansaMusaAI to your audience.",
};

export const dynamic = "force-dynamic";

export default async function AffiliatePage() {
  const session = await auth();
  const userId  = session!.user.id;

  const allAffiliates = await db.affiliate.findMany({
    where: { status: "APPROVED" },
    select: {
      userId: true,
      code:   true,
      clicks: true,
      conversions: {
        select: { commissionCents: true, recurringTotal: true, status: true },
      },
    },
  });

  const ranked = allAffiliates
    .map((a) => ({
      userId:        a.userId,
      code:          a.code,
      clicks:        a.clicks,
      totalEarnings: a.conversions.reduce((s, c) => s + c.commissionCents + c.recurringTotal, 0),
      conversions:   a.conversions.filter((c) => c.status === "CONVERTED").length,
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings);

  const leaderboard = ranked.slice(0, 10).map((r, i) => ({
    rank:               i + 1,
    maskedCode:         r.code.slice(0, 3) + "•••",
    totalEarningsCents: r.totalEarnings,
    conversions:        r.conversions,
    clicks:             r.clicks,
    isCurrentUser:      r.userId === userId,
  }));

  return <AffiliateContent leaderboard={leaderboard} />;
}
