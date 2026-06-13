import type { ChatMessage } from "@/types";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-brand-500 text-white rounded-br-sm"
            : "bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
