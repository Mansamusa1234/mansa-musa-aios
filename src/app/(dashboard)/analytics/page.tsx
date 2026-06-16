import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AnalyticsContent from "./AnalyticsContent";

export const metadata: Metadata = {
  title: "Analytics | MansaMusaAI",
  description: "Usage analytics, AI performance metrics, and growth insights.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  const userId  = session!.user.id;
  const isAdmin = session!.user.role === "ADMIN";

  const where = isAdmin ? {} : { userId };
  const messageWhere = isAdmin ? {} : { conversation: { userId } };

  const [
    totalConversations,
    totalMessages,
    tokenStats,
    newUsersToday,
    newUsersThisMonth,
    messagesThisMonth,
    totalUsers,
  ] = await Promise.all([
    db.conversation.count({ where }),
    db.message.count({ where: messageWhere }),
    db.usageRecord.aggregate({ where: isAdmin ? {} : { userId }, _sum: { inputTokens: true, outputTokens: true } }),
    isAdmin ? db.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }) : Promise.resolve(0),
    isAdmin ? db.user.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }) : Promise.resolve(0),
    db.message.count({ where: { ...messageWhere, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    isAdmin ? db.user.count() : Promise.resolve(1),
  ]);

  const totalTokens = (tokenStats._sum.inputTokens ?? 0) + (tokenStats._sum.outputTokens ?? 0);

  return (
    <AnalyticsContent
      totalConversations={totalConversations}
      totalMessages={totalMessages}
      totalTokens={totalTokens}
      newUsersToday={newUsersToday}
      newUsersThisMonth={newUsersThisMonth}
      messagesThisMonth={messagesThisMonth}
      totalUsers={totalUsers}
      isAdmin={isAdmin}
    />
  );
}
