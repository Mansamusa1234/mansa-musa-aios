import { db } from "@/lib/db";
import MarketingClient from "@/components/admin/MarketingClient";

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  const [referralLeaders, subscriberCount, pushSubscriberCount, couponCount, totalReferrals, totalAffiliates] = await Promise.all([
    db.referral.groupBy({ by: ["referrerId"], where: { status: "CONVERTED" }, _count: { _all: true }, orderBy: { _count: { referrerId: "desc" } }, take: 10 }),
    db.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
    db.pushSubscription.count(),
    db.commissionLedger.count(),
    db.referral.count(),
    db.affiliate.count(),
  ]);

  const referrerIds = referralLeaders.map((l) => l.referrerId);
  const referrers = await db.user.findMany({ where: { id: { in: referrerIds } }, select: { id: true, name: true, email: true } });
  const referrerMap = new Map(referrers.map((r) => [r.id, r]));

  const leaderboard = referralLeaders.map((l) => ({
    name: referrerMap.get(l.referrerId)?.name ?? null,
    email: referrerMap.get(l.referrerId)?.email ?? "—",
    conversions: l._count._all,
  }));

  return (
    <MarketingClient
      leaderboard={leaderboard}
      subscriberCount={subscriberCount}
      pushSubscriberCount={pushSubscriberCount}
      couponCount={couponCount}
      totalReferrals={totalReferrals}
      totalAffiliates={totalAffiliates}
    />
  );
}
