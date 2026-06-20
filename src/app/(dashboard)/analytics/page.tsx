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

  // Build date boundaries for the last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [
    totalConversations,
    totalMessages,
    tokenStats,
    newUsersToday,
    newUsersThisMonth,
    messagesThisMonth,
    totalUsers,
    ...dailyCounts
  ] = await Promise.all([
    db.conversation.count({ where }),
    db.message.count({ where: messageWhere }),
    db.usageRecord.aggregate({ where: isAdmin ? {} : { userId }, _sum: { inputTokens: true, outputTokens: true } }),
    isAdmin ? db.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }) : Promise.resolve(0),
    isAdmin ? db.user.count({ where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }) : Promise.resolve(0),
    db.message.count({ where: { ...messageWhere, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    isAdmin ? db.user.count() : Promise.resolve(1),
    ...days.map((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return db.message.count({ where: { ...messageWhere, createdAt: { gte: d, lt: next } } });
    }),
  ]);

  const totalTokens = (tokenStats._sum.inputTokens ?? 0) + (tokenStats._sum.outputTokens ?? 0);

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = days.map((d, i) => ({
    day: DAY_NAMES[d.getDay()],
    msgs: dailyCounts[i] as number,
  }));

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
      weeklyData={weeklyData}
    />
  );
}
