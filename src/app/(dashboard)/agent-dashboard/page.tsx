import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AgentDashboardContent from "./AgentDashboardContent";

export const metadata: Metadata = {
  title: "My Agents | MansaMusaAI",
  description: "Monitor and manage your deployed AI agents.",
};

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [totalConversations, totalMessages, recentConversations] = await Promise.all([
    db.conversation.count({ where: { userId } }),
    db.message.count({ where: { conversation: { userId } } }),
    db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { _count: { select: { messages: true } } },
    }),
  ]);

  return (
    <AgentDashboardContent
      totalConversations={totalConversations}
      totalMessages={totalMessages}
      recentConversations={recentConversations}
      userName={session!.user.name ?? "User"}
    />
  );
}
