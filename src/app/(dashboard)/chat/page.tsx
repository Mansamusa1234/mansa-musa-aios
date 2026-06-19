import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AGENTS } from "@/data/agents";
import ChatInterface from "@/components/chat/ChatInterface";

export const metadata: Metadata = {
  title: "Chat | MansaMusaAI",
  description: "Chat with your AI agents — automate tasks, get insights, and grow your business.",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ id?: string; agent?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const { id, agent } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  let conversationId = id;
  let agentId: string | null = null;

  if (!conversationId) {
    const requestedAgentId = AGENTS.find((a) => a.id === agent)?.id ?? null;
    const conv = await db.conversation.create({
      data: { userId, title: "New Conversation", agentId: requestedAgentId },
    });
    conversationId = conv.id;
    agentId = conv.agentId;
  } else {
    const conv = await db.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { agentId: true },
    });
    if (!conv) redirect("/chat");
    agentId = conv.agentId;
  }

  // Limit initial message load to last 50 — chat interface can lazy-load older ones
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <div className="flex h-full flex-col">
      <ChatInterface
        conversationId={conversationId}
        initialMessages={messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }))}
        initialAgentId={agentId}
      />
    </div>
  );
}
