"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Ticket {
  id: string; subject: string; body: string; status: Status; priority: Priority;
  aiResponse: string | null; createdAt: Date; updatedAt: Date;
  userName: string | null; userEmail: string;
}

interface Props { isAdmin: boolean; tickets: Ticket[] }

const STATUS_COLORS: Record<Status, string> = {
  OPEN: "bg-blue-500/15 text-blue-400",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400",
  RESOLVED: "bg-green-500/15 text-green-400",
  CLOSED: "bg-gray-500/15 text-gray-400",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "text-gray-400",
  MEDIUM: "text-blue-400",
  HIGH: "text-amber-400",
  URGENT: "text-red-400",
};

export default function SupportContent({ isAdmin, tickets: initial }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>(initial);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, priority }),
      });
      if (!res.ok) { setError("Failed to submit ticket."); return; }
      const data = await res.json();
      setTickets((p) => [data.ticket, ...p]);
      setSubject(""); setBody("");

      const ticketId = data.ticket.id;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 15) { clearInterval(poll); return; }
        try {
          const r = await fetch(`/api/support/tickets/${ticketId}`);
          if (!r.ok) return;
          const d = await r.json();
          if (d.ticket?.aiResponse) {
            clearInterval(poll);
            setTickets((p) => p.map((t) => t.id === ticketId ? { ...t, aiResponse: d.ticket.aiResponse } : t));
            setSelected((s) => s?.id === ticketId ? ({ ...s, aiResponse: d.ticket.aiResponse } as Ticket) : s);
          }
        } catch { /* continue polling */ }
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: Status) {
    await fetch(`/api/support/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setTickets((p) => p.map((t) => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : null);
  }

  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS");
  const closed = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Left: ticket list + form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Submit form */}
        {!isAdmin && (
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New support ticket</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Briefly describe your issue"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Describe the problem in detail"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                {submitting ? "Submitting…" : "Submit ticket"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Open tickets */}
        {open.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Open</p>
            {open.map((t) => (
              <motion.button
                key={t.id}
                initial="hidden" animate="visible" variants={fadeUp}
                onClick={() => setSelected(t)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                  selected?.id === t.id
                    ? "border-brand-500/50 bg-brand-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</span>
                  <span className={`text-xs ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Closed tickets */}
        {closed.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Resolved</p>
            {closed.map((t) => (
              <motion.button
                key={t.id}
                initial="hidden" animate="visible" variants={fadeUp}
                onClick={() => setSelected(t)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                  selected?.id === t.id
                    ? "border-brand-500/50 bg-brand-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <p className="text-sm font-medium text-white/60 truncate">{t.subject}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {tickets.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No tickets yet.</p>
        )}
      </div>

      {/* Right: selected ticket */}
      <div className="lg:col-span-3">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selected.subject}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selected.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {isAdmin && selected.userName ? ` · ${selected.userName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]}`}>{selected.status.replace("_", " ")}</span>
                  <span className={`text-xs ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.body}</p>
              </div>

              {selected.aiResponse && (
                <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
                  <p className="text-xs font-semibold text-brand-400 mb-2">AI Response</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.aiResponse}</p>
                </div>
              )}

              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as Status[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        selected.status === s
                          ? "border-brand-500 bg-brand-500/20 text-brand-300"
                          : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
            >
              <p className="text-sm text-gray-500">Select a ticket to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
