"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Ticket { id: string; subject: string; body: string; status: Status; priority: Priority; aiResponse: string | null; createdAt: Date; updatedAt: Date; userName: string | null; userEmail: string; }
interface Props { isAdmin: boolean; tickets: Ticket[] }

const STATUS_COLORS: Record<Status, string> = { OPEN: "bg-blue-500/15 text-blue-400", IN_PROGRESS: "bg-amber-500/15 text-amber-400", RESOLVED: "bg-green-500/15 text-green-400", CLOSED: "bg-gray-500/15 text-gray-500" };
const PRIORITY_COLORS: Record<Priority, string> = { LOW: "text-gray-500", MEDIUM: "text-amber-400", HIGH: "text-orange-400", URGENT: "text-red-400" };

export default function SupportContent({ isAdmin, tickets: initialTickets }: Props) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", priority: "MEDIUM" as Priority });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) return;
      const data = await res.json();
      const newTicket = { ...data.ticket, userName: null, userEmail: "" };
      setTickets((p) => [newTicket, ...p]);
      setShowNew(false);
      setForm({ subject: "", body: "", priority: "MEDIUM" });
      setSelected(newTicket);
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
            setSelected((s) => s?.id === ticketId ? { ...s, aiResponse: d.ticket.aiResponse } : s);
          }
        } catch { /* continue polling */ }
      }, 2000);
    } finally { setSubmitting(false); }
  }

  async function updateStatus(id: string, status: Status) {
    await fetch(`/api/support/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setTickets((p) => p.map((t) => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : null);
  }

  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS");
  const closed = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-5xl">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Support ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">AI Customer Support</h1>
          <p className="mt-1 text-sm text-gray-500">AI-powered instant responses with human escalation.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 shrink-0">+ New ticket</button>
      </motion.div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {open.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Open / In progress ({open.length})</p>
              {open.map((t) => (<motion.div key={t.id} variants={scaleIn} onClick={() => setSelected(t)} className={`cursor-pointer rounded-2xl border p-4 transition-colors ${selected?.id === t.id ? "border-brand-500/40 bg-brand-500/5" : "border-white/8 bg-white/3 hover:border-brand-500/20"}`}><div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{t.subject}</p>{isAdmin && <p className="text-xs text-gray-400">{t.userName ?? t.userEmail}</p>}</div><div className="flex items-center gap-2 flex-shrink-0"><span className={`text-[10px] font-bold ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</span></div></div><p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{t.body}</p><p className="text-[10px] text-gray-500 mt-1">{new Date(t.createdAt).toLocaleDateString("en-GB")}</p></motion.div>))}
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 mt-4">Resolved / Closed ({closed.length})</p>
              {closed.slice(0, 5).map((t) => (<div key={t.id} onClick={() => setSelected(t)} className="cursor-pointer rounded-2xl border border-white/6 bg-white/2 p-3 hover:bg-white/4 transition-colors mb-2"><p className="text-xs text-gray-500 truncate">{t.subject}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUS_COLORS[t.status]}`}>{t.status}</span></div>))}
            </div>
          )}
          {tickets.length === 0 && (<div className="rounded-2xl border border-dashed border-white/10 p-12 text-center"><p className="text-3xl mb-3">🎧</p><p className="text-gray-400 font-medium">No support tickets yet</p><p className="text-sm text-gray-400 mt-1">When you submit a ticket, our AI responds in seconds.</p></div>)}
        </div>
        {selected && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-white/8 bg-white/3 p-5 h-fit sticky top-4 space-y-4">
            <div className="flex items-start justify-between gap-2"><h2 className="text-sm font-bold text-white leading-snug">{selected.subject}</h2><button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-300 text-lg leading-none">×</button></div>
            <div className="flex gap-2 flex-wrap"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[selected.status]}`}>{selected.status.replace("_", " ")}</span><span className={`text-[10px] font-bold ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span></div>
            <div><p className="text-xs font-medium text-gray-400 mb-1">Your message</p><p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{selected.body}</p></div>
            {selected.aiResponse ? (<div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-3"><p className="text-xs font-bold text-brand-400 mb-1.5">AI Response</p><p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{selected.aiResponse}</p></div>) : (<div className="rounded-xl border border-white/8 bg-white/2 p-3 text-center"><p className="text-xs text-gray-500">AI response generating...</p></div>)}
            {isAdmin && (<div className="flex gap-2 flex-wrap">{(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as Status[]).map((s) => (<button key={s} onClick={() => updateStatus(selected.id, s)} disabled={selected.status === s} className={`rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-colors ${selected.status === s ? "border-brand-500/40 bg-brand-500/10 text-brand-400" : "border-white/8 text-gray-500 hover:text-gray-300"}`}>{s.replace("_", " ")}</button>))}</div>)}
          </motion.div>
        )}
      </div>
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-2xl border border-white/8 bg-[#0e0e1a] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Open a support ticket</h2>
            <form onSubmit={submit} className="space-y-4">
              <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject *" className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none" />
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className="w-full rounded-xl border border-white/8 bg-[#0e0e1a] px-3 py-2.5 text-sm text-white outline-none"><option value="LOW">Low priority</option><option value="MEDIUM">Medium priority</option><option value="HIGH">High priority</option><option value="URGENT">Urgent</option></select>
              <textarea required rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Describe your issue in detail..." className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none resize-none" />
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">{submitting ? "Submitting..." : "Submit ticket"}</button>
                <button type="button" onClick={() => setShowNew(false)} className="rounded-xl border border-white/8 px-4 py-2.5 text-sm text-gray-400">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
