import { db } from "@/lib/db";
import CommissionsClient from "@/components/admin/CommissionsClient";

export const dynamic = "force-dynamic";

export default async function AdminCommissionsPage() {
  const entries = await db.commissionLedger.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const totals = {
    pendingCents: entries.filter((e) => e.status === "PENDING").reduce((s, e) => s + e.amountCents, 0),
    approvedCents: entries.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amountCents, 0),
    paidCents: entries.filter((e) => e.status === "PAID").reduce((s, e) => s + e.amountCents, 0),
  };

  return (
    <CommissionsClient
      entries={entries.map((e) => ({
        id: e.id,
        userName: e.user.name,
        userEmail: e.user.email,
        sourceType: e.sourceType,
        amountCents: e.amountCents,
        status: e.status,
        createdAt: e.createdAt,
      }))}
      totals={totals}
    />
  );
}
