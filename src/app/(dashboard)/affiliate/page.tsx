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
  const userId = session!.user.id;

  const affiliate = await db.affiliate.findUnique({
    where: { userId },
    include: {
      conversions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!affiliate) {
    return <AffiliateContent affiliate={null} conversions={[]} totalCommissionCents={0} />;
  }

  const totalCommissionCents = affiliate.conversions.reduce((sum, c) => sum + c.commissionCents, 0);

  return (
    <AffiliateContent
      affiliate={{ code: affiliate.code, clicks: affiliate.clicks, commissionRate: affiliate.commissionRate }}
      conversions={affiliate.conversions.map((c) => ({
        id: c.id,
        status: c.status,
        commissionCents: c.commissionCents,
        createdAt: c.createdAt,
      }))}
      totalCommissionCents={totalCommissionCents}
    />
  );
}
