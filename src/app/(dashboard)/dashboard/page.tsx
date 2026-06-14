import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [conversations, subscription] = await Promise.all([
    db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { messages: true } } },
    }),
    db.subscription.findUnique({ where: { userId } }),
  ]);

  const plan = subscription?.status === "ACTIVE" ? "Paid" : "Free";
  const status = subscription?.status ?? "Inactive";

  return (
    <DashboardClient
      userName={session!.user.name?.split(" ")[0] ?? "there"}
      conversations={conversations}
      plan={plan}
      status={status}
      totalConversations={conversations.length}
    />
  );
}
