import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import RevenueContent from "./RevenueContent";

export const metadata: Metadata = {
  title: "Revenue Dashboard | MansaMusaAI",
  description: "Real-time revenue metrics, MRR tracking, and financial analytics.",
};

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const session = await auth();
  if (session!.user.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMon = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMon   = new Date(now.getFullYear(), now.getMonth(), 0);

  // Build 6-month windows for MRR history
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1), label: d.toLocaleString("en-GB", { month: "short" }) };
  });

  const [
    totalUsers,
    activeSubs,
    cancelledSubs,
    newThisMonth,
    newLastMonth,
    activeSubs_raw,
    ...monthlySubsArrays
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "CANCELED" } }),
    db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.user.count({ where: { createdAt: { gte: startOfLastMon, lte: endOfLastMon } } }),
    db.subscription.findMany({ where: { status: "ACTIVE" }, select: { stripePriceId: true } }),
    ...months.map((m) =>
      db.subscription.findMany({
        where: { createdAt: { gte: m.start, lt: m.end }, status: { not: "CANCELED" } },
        select: { stripePriceId: true },
      })
    ),
  ]);

  const mrr = activeSubs_raw.reduce((sum, sub) => {
    const plan = PLANS.find((p) => p.priceId === sub.stripePriceId);
    return sum + (plan?.price ?? 0);
  }, 0);

  const mrrHistory = months.map((m, i) => ({
    month: m.label,
    mrr: (monthlySubsArrays[i] as { stripePriceId: string | null }[]).reduce((sum, sub) => {
      const plan = PLANS.find((p) => p.priceId === sub.stripePriceId);
      return sum + (plan?.price ?? 0);
    }, 0),
  }));

  const planBreakdown = PLANS.filter((p) => p.price > 0).map((p) => ({
    name: p.name,
    price: p.price,
    count: activeSubs_raw.filter((s) => s.stripePriceId === p.priceId).length,
    revenue: activeSubs_raw.filter((s) => s.stripePriceId === p.priceId).length * p.price,
  }));

  const growthRate = newLastMonth > 0
    ? (((newThisMonth - newLastMonth) / newLastMonth) * 100).toFixed(1)
    : "0.0";

  const churnRate = totalUsers > 0
    ? ((cancelledSubs / (activeSubs + cancelledSubs)) * 100).toFixed(1)
    : "0.0";

  const arpu = activeSubs > 0 ? (mrr / activeSubs).toFixed(0) : "0";

  return (
    <RevenueContent
      mrr={mrr}
      arr={mrr * 12}
      totalUsers={totalUsers}
      paidUsers={activeSubs}
      freeUsers={totalUsers - activeSubs}
      cancelledSubs={cancelledSubs}
      growthRate={growthRate}
      churnRate={churnRate}
      arpu={Number(arpu)}
      newThisMonth={newThisMonth}
      planBreakdown={planBreakdown}
      mrrHistory={mrrHistory}
    />
  );
}
