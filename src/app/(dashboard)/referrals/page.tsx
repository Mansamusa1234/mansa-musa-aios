import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateReferralCode } from "@/lib/referrals";
import ReferralsContent from "./ReferralsContent";

export const metadata: Metadata = {
  title: "Referrals | MansaMusaAI",
  description: "Invite friends to MansaMusaAI and track the rewards you've earned.",
};

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [code, referrals, leaderboard] = await Promise.all([
    getOrCreateReferralCode(userId),
    db.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    db.referral.groupBy({ by: ["referrerId"], where: { status: "CONVERTED" }, _count: { _all: true } }),
  ]);

  const referredUserIds = referrals.map((r) => r.referredUserId).filter(Boolean);
  const referredUsers = await db.user.findMany({
    where: { id: { in: referredUserIds } },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  const referredUserMap = new Map(referredUsers.map((u) => [u.id, u]));

  const totalRewardCents = referrals.reduce((sum, r) => sum + r.rewardCents, 0);
  const convertedCount = referrals.filter((r) => r.status === "CONVERTED").length;

  const sortedLeaderboard = [...leaderboard].sort((a, b) => b._count._all - a._count._all);
  const rankIndex = sortedLeaderboard.findIndex((l) => l.referrerId === userId);
  const rank = rankIndex === -1 ? null : rankIndex + 1;
  const totalRankedReferrers = sortedLeaderboard.length;

  return (
    <ReferralsContent
      code={code}
      referrals={referrals.map((r) => {
        const ru = referredUserMap.get(r.referredUserId);
        return {
          id: r.id,
          name: ru?.name ?? null,
          email: ru?.email ?? "",
          joinedAt: ru?.createdAt ?? r.createdAt,
          status: r.status,
          rewardCents: r.rewardCents,
          payoutStatus: null,
        };
      })}
      totalRewardCents={totalRewardCents}
      convertedCount={convertedCount}
      rank={rank}
      totalRankedReferrers={totalRankedReferrers}
    />
  );
}
