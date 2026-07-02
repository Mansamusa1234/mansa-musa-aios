import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:   "bg-green-500/15 text-green-400",
  TRIALING: "bg-blue-500/15 text-blue-400",
  PAST_DUE: "bg-red-500/15 text-red-400",
  CANCELED: "bg-gray-500/10 text-gray-500",
  INACTIVE: "bg-gray-500/10 text-gray-500",
};

function churnRisk(sub: {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  messagesThisMonth: number;
}): { label: string; style: string } {
  if (sub.cancelAtPeriodEnd) return { label: "Cancelling", style: "text-red-400" };
  if (sub.status === "PAST_DUE")  return { label: "Payment failed", style: "text-red-400" };
  if (sub.messagesThisMonth === 0) return { label: "No activity", style: "text-amber-400" };
  return { label: "Healthy", style: "text-green-400" };
}

export default async function AdminCustomersPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const subs = await db.subscription.findMany({
    where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: { select: { conversations: true } },
        },
      },
    },
    orderBy: { currentPeriodStart: "desc" },
  });

  const userIds = subs.map((s) => s.userId);
  const usageThisMonth = await db.usageRecord.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, createdAt: { gte: startOfMonth } },
    _count: { id: true },
  });
  const usageMap = Object.fromEntries(usageThisMonth.map((u) => [u.userId, u._count.id]));

  const rows = subs.map((sub) => {
    const plan = PLANS.find((p) => p.priceId === sub.stripePriceId);
    const messagesThisMonth = usageMap[sub.userId] ?? 0;
    const risk = churnRisk({
      status: sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: sub.currentPeriodEnd,
      messagesThisMonth,
    });
    return { sub, plan, messagesThisMonth, risk };
  });

  const totalMrr = rows.reduce((sum, r) => sum + (r.plan?.price ?? 0), 0);
  const atRisk = rows.filter((r) => r.risk.label !== "Healthy").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">Paying &amp; trialling subscribers</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total customers", value: subs.length.toString() },
          { label: "MRR", value: `£${totalMrr.toLocaleString()}` },
          { label: "ARR", value: `£${(totalMrr * 12).toLocaleString()}` },
          { label: "At-risk", value: atRisk.toString(), warn: atRisk > 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.warn ? "text-amber-400" : "text-white"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <table className="w-full text-sm">
          <thead className="border-b border-white/6 bg-white/3">
            <tr>
              {["Customer", "Plan", "MRR", "Status", "Msgs this month", "Conversations", "Customer since", "Risk"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-600">
                  No paying customers yet
                </td>
              </tr>
            )}
            {rows.map(({ sub, plan, messagesThisMonth, risk }) => (
              <tr key={sub.id} className="hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{sub.user.name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{sub.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-300">
                    {plan?.name ?? "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-white">
                  £{plan?.price ?? 0}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[sub.status] ?? STATUS_STYLE.INACTIVE}`}>
                    {sub.status}
                    {sub.cancelAtPeriodEnd ? " (cancelling)" : ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{messagesThisMonth}</td>
                <td className="px-4 py-3 text-gray-400">{sub.user._count.conversations}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {new Date(sub.user.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${risk.style}`}>{risk.label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {atRisk > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-300">{atRisk} customer{atRisk !== 1 ? "s" : ""} at risk of churning</p>
          <p className="mt-1 text-xs text-amber-500/70">
            Includes: no activity this month, payment failed, or scheduled cancellation.
            The win-back and trial-ending cron jobs will attempt automated re-engagement.
          </p>
          <Link href="/admin/billing" className="mt-2 inline-block text-xs text-amber-400 underline">
            View billing diagnostics →
          </Link>
        </div>
      )}
    </div>
  );
}
