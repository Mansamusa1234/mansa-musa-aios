import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import AdminClient from "@/components/admin/AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeSubscriptions,
    cancelledSubscriptions,
    totalConversations,
    totalMessages,
    newUsersToday,
    messagesThisMonth,
    tokenStats,
    activeSubs,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "CANCELED" } }),
    db.conversation.count(),
    db.message.count(),
    db.user.count({ where: { createdAt: { gte: startOfToday } } }),
    db.message.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.usageRecord.aggregate({ _sum: { inputTokens: true, outputTokens: true } }),
    db.subscription.findMany({ where: { status: "ACTIVE" }, select: { stripePriceId: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
  ]);

  const mrr = activeSubs.reduce((sum, sub) => {
    const plan = PLANS.find((p) => p.priceId === sub.stripePriceId);
    return sum + (plan?.price ?? 0);
  }, 0);

  const freeUsers = totalUsers - activeSubscriptions;
  const conversionRate =
    totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : "0.0";

  const totalTokens =
    (tokenStats._sum.inputTokens ?? 0) + (tokenStats._sum.outputTokens ?? 0);

  return (
    <AdminClient
      totalUsers={totalUsers}
      paidUsers={activeSubscriptions}
      freeUsers={freeUsers}
      cancelledSubscriptions={cancelledSubscriptions}
      conversionRate={conversionRate}
      totalConversations={totalConversations}
      totalMessages={totalMessages}
      newUsersToday={newUsersToday}
      messagesThisMonth={messagesThisMonth}
      mrr={mrr}
      arr={mrr * 12}
      totalTokens={totalTokens}
      recentUsers={recentUsers}
      health={{
        stripe: !!process.env.STRIPE_SECRET_KEY,
        redis: !!process.env.UPSTASH_REDIS_REST_URL,
        ai: !!process.env.ANTHROPIC_API_KEY,
        database: true,
      }}
    />
  );
}
