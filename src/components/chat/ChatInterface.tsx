"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";
import { AGENTS } from "@/data/agents";
import MessageBubble from "./MessageBubble";

interface Props {
  conversationId: string;
  initialMessages: ChatMessage[];
  initialAgentId?: string | null;
}

export default function ChatInterface({ conversationId, initialMessages, initialAgentId = null }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(initialAgentId);
  const [agentSaving, setAgentSaving] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [memory, setMemory] = useState("");
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [memorySaving, setMemorySaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agent = agentId ? AGENTS.find((a) => a.id === agentId) ?? null : null;

  async function handleAgentChange(newAgentId: string) {
    const value = newAgentId || null;
    setAgentSaving(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/agent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: value }),
      });
      if (res.ok) setAgentId(value);
    } finally {
      setAgentSaving(false);
    }
  }

  async function toggleMemory() {
    const opening = !showMemory;
    setShowMemory(opening);
    if (opening && !memoryLoaded && agent) {
      const res = await fetch(`/api/agent-memory?agentId=${agent.id}`);
      if (res.ok) {
        const data = await res.json();
        setMemory(data.content ?? "");
      }
      setMemoryLoaded(true);
    }
  }

  async function saveMemory() {
    if (!agent) return;
    setMemorySaving(true);
    try {
      await fetch("/api/agent-memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, content: memory }),
      });
    } finally {
      setMemorySaving(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || streaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: content }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Agent bar */}
      <div className="mb-3 flex items-center gap-2">
        {messages.length === 0 ? (
          <select
            value={agentId ?? ""}
            disabled={agentSaving}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-brand-500 disabled:opacity-50"
          >
            <option value="">💬 General Assistant</option>
            {AGENTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        ) : agent ? (
          <span className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700">
            {agent.icon} {agent.name}
          </span>
        ) : null}

        {agent && (
          <button
            onClick={toggleMemory}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 transition-colors"
          >
            🧠 Memory
          </button>
        )}
      </div>

      {showMemory && agent && (
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-700">
            Notes for {agent.name} to remember about you
          </p>
          <textarea
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="e.g. our fiscal year ends in March, we operate in the UK and US…"
            className="w-full resize-none rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-brand-500"
          />
          <div className="mt-1.5 flex justify-end">
            <button
              onClick={saveMemory}
              disabled={memorySaving}
              className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {memorySaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin pr-1">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            Send a message to start the conversation
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {streaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-1 pl-4">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message MansaMusaAI…"
          className="w-full resize-none text-sm outline-none placeholder:text-gray-400"
          style={{ maxHeight: 160 }}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40 transition-colors"
          >
            {streaming ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
