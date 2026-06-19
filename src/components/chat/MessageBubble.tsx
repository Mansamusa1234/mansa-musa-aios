import type { ChatMessage } from "@/types";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const sourcesMarker = "\n\nSources Used\n";
  const [answer, sourcesBlock] = !isUser && message.content.includes(sourcesMarker)
    ? message.content.split(sourcesMarker)
    : [message.content, ""];
  const sources = sourcesBlock
    ? sourcesBlock.split("\n").map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean)
    : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-brand-500 text-white rounded-br-sm"
            : "bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm"
        }`}
      >
        {answer}
        {sources.length > 0 && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <p className="mb-2 font-bold text-gray-800">Sources Used</p>
            <ul className="space-y-1">
              {sources.map((source) => (
                <li key={source} className="flex gap-2">
                  <span className="text-brand-500">•</span>
                  <span>{source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
