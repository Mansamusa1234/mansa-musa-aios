import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ChatInterface from "@/components/chat/ChatInterface";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  let conversationId = id;

  if (!conversationId) {
    const conv = await db.conversation.create({
      data: { userId, title: "New Conversation" },
    });
    conversationId = conv.id;
  }

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
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
      />
    </div>
  );
}
