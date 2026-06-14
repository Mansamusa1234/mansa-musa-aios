import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  if (!isAdmin) {
    const [myConversations, myMessages, myTokens] = await Promise.all([
      db.conversation.count({ where: { userId } }),
      db.message.count({
        where: { conversation: { userId } },
      }),
      db.usageRecord.aggregate({
        where: { userId },
        _sum: { inputTokens: true, outputTokens: true },
      }),
    ]);
    return NextResponse.json({
      myConversations,
      myMessages,
      myInputTokens: myTokens._sum.inputTokens ?? 0,
      myOutputTokens: myTokens._sum.outputTokens ?? 0,
    });
  }

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
    topUsage,
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
      take: 10,
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
    db.usageRecord.groupBy({
      by: ["userId"],
      _sum: { inputTokens: true, outputTokens: true },
      orderBy: { _sum: { outputTokens: "desc" } },
      take: 10,
    }),
  ]);

  const mrr = activeSubs.reduce((sum, sub) => {
    const plan = PLANS.find((p) => p.priceId === sub.stripePriceId);
    return sum + (plan?.price ?? 0);
  }, 0);

  const freeUsers = totalUsers - activeSubscriptions;
  const conversionRate = totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    totalUsers,
    activeSubscriptions,
    cancelledSubscriptions,
    freeUsers,
    totalConversations,
    totalMessages,
    newUsersToday,
    messagesThisMonth,
    totalInputTokens: tokenStats._sum.inputTokens ?? 0,
    totalOutputTokens: tokenStats._sum.outputTokens ?? 0,
    totalTokens: (tokenStats._sum.inputTokens ?? 0) + (tokenStats._sum.outputTokens ?? 0),
    mrr,
    arr: mrr * 12,
    conversionRate,
    recentUsers,
    topUsage,
    health: {
      stripe: !!process.env.STRIPE_SECRET_KEY,
      redis: !!process.env.UPSTASH_REDIS_REST_URL,
      ai: !!process.env.ANTHROPIC_API_KEY,
      database: true,
    },
  });
}
