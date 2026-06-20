"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CSUITE_AGENTS } from "@/lib/csuiteAgents";
import type { CsuiteRole } from "@/lib/csuiteAgents";
import Link from "next/link";

interface Props {
  leadsCount: number;
  openTickets: number;
  upcomingBookings: number;
  receptionistActive: boolean;
  receptionistChats: number;
  deployedAgents: number;
  competitions: number;
  wisdomAssets: number;
}

interface Msg { role: "user" | "assistant"; content: string }

function relTime(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function WorkforceContent(props: Props) {
  const [activeRole, setActiveRole] = useState<CsuiteRole | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const agent = activeRole ? CSUITE_AGENTS.find((a) => a.role === activeRole) : null;

  const loadHistory = useCallback(async (role: CsuiteRole) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/workforce/chat?role=${role}`);
      const data = await res.json() as { messages: Msg[] };
      setMessages(data.messages ?? []);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeRole) loadHistory(activeRole);
  }, [activeRole, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send() {
    if (!input.trim() || !activeRole || thinking) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/workforce/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: activeRole, messages: [...messages, userMsg] }),
      });
      const data = await res.json() as { reply: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setThinking(false);
    }
  }

  async function clearChat() {
    if (!activeRole) return;
    await fetch(`/api/workforce/chat?role=${activeRole}`, { method: "DELETE" });
    setMessages([]);
  }

  const stats = [
    { label: "CRM Leads", value: props.leadsCount, href: "/crm", icon: "👥" },
    { label: "Open Tickets", value: props.openTickets, href: "/support", icon: "🎫" },
    { label: "Bookings", value: props.upcomingBookings, href: "/calendar", icon: "📅" },
    { label: "Active Agents", value: props.deployedAgents, href: "/marketplace", icon: "🤖" },
    { label: "Competitions", value: props.competitions, href: "/compete", icon: "⚔️" },
    { label: "Wisdom Assets", value: props.wisdomAssets, href: "/wisdom", icon: "💎" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">· AI Workforce OS ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Your Executive Team</h1>
          <p className="mt-1 text-sm text-gray-500">10 AI executives — available 24/7. Click any role to start a conversation.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/marketplace" className="rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/8 transition-colors">
            🤖 Agent Marketplace
          </Link>
          <Link href="/receptionist" className="rounded-xl border border-white/8 bg-white/4 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/8 transition-colors">
            📞 Receptionist
          </Link>
        </div>
      </div>

      {/* Business stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-xl border border-white/8 bg-white/2 p-3 hover:bg-white/4 transition-colors text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* C-Suite grid + chat panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">C-Suite Roster</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CSUITE_AGENTS.map((a) => (
              <motion.button
                key={a.role}
                onClick={() => setActiveRole(activeRole === a.role ? null : a.role)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-xl border p-3 text-left transition-all ${
                  activeRole === a.role
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-white/8 bg-white/2 hover:bg-white/4"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg ${a.bg}`}>
                    {a.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${activeRole === a.role ? "text-indigo-300" : "text-gray-200"}`}>{a.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${a.bg} ${a.color}`}>{a.title.split(" ").slice(-2).join(" ")}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{a.description}</p>
                  </div>
                </div>
                {activeRole === a.role && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.responsibilities.map((r) => (
                      <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-white/6 text-gray-400">{r}</span>
                    ))}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex flex-col rounded-xl border border-white/8 bg-[#0a0a18] overflow-hidden" style={{ minHeight: 480 }}>
          {!activeRole ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="text-5xl">👔</div>
              <h3 className="text-lg font-bold text-white">Select an executive</h3>
              <p className="text-sm text-gray-500 max-w-xs">Choose any C-Suite role from the left to start an AI-powered executive consultation.</p>
              <div className="grid grid-cols-2 gap-2 text-left w-full max-w-xs">
                {[
                  "📊 Review your financial model",
                  "⚖️ Draft a contractor agreement",
                  "🎯 Build a sales playbook",
                  "🚀 Plan your go-to-market",
                ].map((t) => (
                  <div key={t} className="rounded-lg border border-white/6 bg-white/3 p-2 text-xs text-gray-400">{t}</div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base ${agent!.bg}`}>
                  {agent!.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${agent!.color}`}>{agent!.name} · {agent!.title}</div>
                  <div className="text-[10px] text-green-400">● Online now</div>
                </div>
                <button onClick={clearChat} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                  Clear
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingHistory ? (
                  <div className="text-center text-gray-600 text-sm py-8">Loading conversation…</div>
                ) : messages.length === 0 ? (
                  <div className="space-y-3">
                    <div className="text-center text-gray-600 text-xs py-4">Start your consultation below</div>
                    <div className="grid grid-cols-1 gap-2">
                      {agent!.responsibilities.map((r) => (
                        <button
                          key={r}
                          onClick={() => { setInput(`Help me with: ${r}`); }}
                          className="text-left rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-xs text-gray-400 hover:bg-white/6 hover:text-gray-200 transition-colors"
                        >
                          💬 {r}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <AnimatePresence key={i}>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {m.role === "assistant" && (
                          <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs ${agent!.bg}`}>
                            {agent!.emoji}
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-white/6 text-gray-200"
                        }`}>
                          {m.content}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ))
                )}
                {thinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-start">
                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs ${agent!.bg}`}>
                      {agent!.emoji}
                    </div>
                    <div className="bg-white/6 rounded-xl px-3 py-2">
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            className="block w-1.5 h-1.5 rounded-full bg-gray-400"
                          />
                        ))}
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-white/8">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder={`Ask ${agent!.name} anything…`}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                    disabled={thinking}
                  />
                  <button
                    onClick={send}
                    disabled={thinking || !input.trim()}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/receptionist", label: "AI Receptionist", icon: "📞", desc: "Voice, chat, SMS" },
          { href: "/crm",          label: "CRM & Leads",     icon: "👥", desc: "Pipeline management" },
          { href: "/compete",      label: "Agent Arena",     icon: "⚔️", desc: "AI competitions" },
          { href: "/team",         label: "Your Team",       icon: "🏢", desc: "Invite & manage" },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className="rounded-xl border border-white/8 bg-white/2 p-4 hover:bg-white/4 transition-colors">
            <div className="text-2xl mb-2">{l.icon}</div>
            <div className="text-sm font-semibold text-white">{l.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
