"use client";

import { useEffect, useState, useRef } from "react";

interface WaMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  direction: "INBOUND" | "OUTBOUND";
  createdAt: string;
}

export default function WhatsAppPage() {
  const [messages, setMessages]   = useState<WaMessage[]>([]);
  const [to, setTo]               = useState("");
  const [body, setBody]           = useState("");
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const bottomRef                 = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/whatsapp/send?limit=100");
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages.reverse());
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), body: body.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to send");
      } else {
        setBody("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
        <p className="text-sm text-gray-400 mt-0.5">AI-powered WhatsApp inbox. Inbound messages get an instant AI reply.</p>
      </div>

      {/* Setup notice */}
      {!process.env.NEXT_PUBLIC_TWILIO_CONFIGURED && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          To enable WhatsApp: add <code className="font-mono text-xs">TWILIO_ACCOUNT_SID</code>, <code className="font-mono text-xs">TWILIO_AUTH_TOKEN</code>, and <code className="font-mono text-xs">TWILIO_WHATSAPP_NUMBER</code> to your environment variables, then point your Twilio WhatsApp sandbox webhook at <code className="font-mono text-xs">/api/whatsapp/incoming</code>.
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-2">
            <span className="text-4xl">💬</span>
            <p>No messages yet. Send one below or wait for inbound messages.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
              m.direction === "OUTBOUND"
                ? "bg-brand-600 text-white rounded-br-sm"
                : "bg-gray-800 text-gray-100 rounded-bl-sm"
            }`}>
              <p className="leading-relaxed">{m.body}</p>
              <p className={`text-xs mt-1 ${m.direction === "OUTBOUND" ? "text-brand-200" : "text-gray-500"}`}>
                {m.direction === "INBOUND" ? m.from : "You"} · {new Date(m.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Send form */}
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          placeholder="+447700900000"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-36 shrink-0 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="text"
          placeholder="Type a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !to.trim() || !body.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
