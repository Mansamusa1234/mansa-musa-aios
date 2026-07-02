"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

type Stage = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
type ActivityType = "NOTE" | "EMAIL" | "CALL" | "MEETING" | "TASK";

interface LeadRow { id: string; name: string; email: string | null; company: string | null; value: number; source: string | null; notes: string | null; createdAt: Date; updatedAt: Date; }
interface Activity { id: string; type: string; note: string | null; createdAt: string; }
interface PipelineCol { stage: Stage; leads: LeadRow[] }
interface Props { pipeline: PipelineCol[]; totalLeads: number; totalValue: number; wonCount: number; pipelineValue: number; userId: string; }

const STAGE_META: Record<Stage, { label: string; color: string; dot: string }> = {
  NEW:       { label: "New",       color: "border-gray-500/30 bg-gray-500/5",   dot: "bg-gray-400" },
  CONTACTED: { label: "Contacted", color: "border-blue-500/30 bg-blue-500/5",   dot: "bg-blue-400" },
  QUALIFIED: { label: "Qualified", color: "border-brand-500/30 bg-brand-500/5", dot: "bg-brand-400" },
  PROPOSAL:  { label: "Proposal",  color: "border-amber-500/30 bg-amber-500/5", dot: "bg-amber-400" },
  WON:       { label: "Won",       color: "border-green-500/30 bg-green-500/5", dot: "bg-green-400" },
  LOST:      { label: "Lost",      color: "border-red-500/30 bg-red-500/5",     dot: "bg-red-400"   },
};

const ACTIVITY_ICONS: Record<ActivityType, string> = { NOTE: "📝", EMAIL: "📧", CALL: "📞", MEETING: "🤝", TASK: "✅" };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CRMContent({ pipeline, totalLeads, totalValue, wonCount, pipelineValue, userId }: Props) {
  const [cols, setCols] = useState(pipeline);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", value: "0", source: "", notes: "", stage: "NEW" as Stage });
  const [dragId, setDragId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actNote, setActNote] = useState("");
  const [actType, setActType] = useState<ActivityType>("NOTE");
  const [savingAct, setSavingAct] = useState(false);

  const captureUrl = typeof window !== "undefined" ? `${window.location.origin}/lead-capture/${userId}` : `/lead-capture/${userId}`;
  const fmtGBP = (p: number) => `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;

  function copyCaptureUrl() { navigator.clipboard.writeText(captureUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }

  const loadActivities = useCallback(async (leadId: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/activities`);
      if (res.ok) setActivities((await res.json()).activities);
    } catch { /* leave activities as-is */ }
  }, []);

  useEffect(() => { if (selectedLead) loadActivities(selectedLead.id); }, [selectedLead, loadActivities]);

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLead || !actNote.trim()) return;
    setSavingAct(true);
    const res = await fetch(`/api/crm/leads/${selectedLead.id}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: actType, note: actNote.trim() }) });
    if (res.ok) { const data = await res.json(); setActivities((prev) => [data.activity, ...prev]); setActNote(""); }
    setSavingAct(false);
  }

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/crm/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, value: parseInt(form.value, 10) * 100 }) });
      if (res.ok) {
        const data = await res.json();
        if (data.lead) { setCols((prev) => prev.map((col) => col.stage === data.lead.stage ? { ...col, leads: [data.lead, ...col.leads] } : col)); setShowAdd(false); setForm({ name: "", email: "", company: "", phone: "", value: "0", source: "", notes: "", stage: "NEW" }); }
      }
    } finally { setAdding(false); }
  }

  async function moveLead(leadId: string, toStage: Stage) {
    const res = await fetch(`/api/crm/leads/${leadId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: toStage }) });
    if (res.ok) {
      setCols((prev) => { let moved: LeadRow | undefined; const next = prev.map((col) => { const leads = col.leads.filter((l) => { if (l.id === leadId) { moved = l; return false; } return true; }); return { ...col, leads }; }); return next.map((col) => col.stage === toStage && moved ? { ...col, leads: [{ ...moved }, ...col.leads] } : col); });
      if (selectedLead?.id === leadId) setSelectedLead((prev) => prev ? { ...prev } : null);
    }
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
      if (res.ok) { setCols((prev) => prev.map((col) => ({ ...col, leads: col.leads.filter((l) => l.id !== id) }))); if (selectedLead?.id === id) setSelectedLead(null); }
    } catch { /* network error — lead stays visible */ }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· CRM ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Lead Pipeline</h1>
          <p className="mt-1 text-sm text-gray-500">Track your leads from first contact to closed deal.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shrink-0">+ Add Lead</button>
      </motion.div>
      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: "Total leads", value: totalLeads.toString() }, { label: "Pipeline value", value: fmtGBP(pipelineValue) }, { label: "Deals won", value: wonCount.toString() }, { label: "Revenue closed", value: fmtGBP(totalValue) }].map((s) => (
          <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-xl font-extrabold text-brand-400">{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
      <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-300 mb-1">Your lead capture page</p><p className="text-xs text-gray-500 truncate">{captureUrl}</p></div>
        <button onClick={copyCaptureUrl} className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${copiedUrl ? "border-green-500/40 text-green-400" : "border-white/8 text-gray-300 hover:text-white"}`}>{copiedUrl ? "✓ Copied!" : "Copy URL"}</button>
        <a href={captureUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl border border-white/8 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors">Preview</a>
      </motion.div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {cols.map(({ stage, leads }) => {
            const meta = STAGE_META[stage];
            return (
              <div key={stage} className={`w-56 rounded-2xl border p-3 ${meta.color} flex-shrink-0`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragId) moveLead(dragId, stage); setDragId(null); }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <p className="text-xs font-bold text-gray-300">{meta.label}</p>
                  <span className="ml-auto text-[10px] text-gray-400 bg-white/5 rounded-full px-2 py-0.5">{leads.length}</span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {leads.map((lead) => (
                    <div key={lead.id} draggable onDragStart={() => setDragId(lead.id)} onClick={() => { setSelectedLead(lead); setActivities([]); }}
                      className="rounded-xl border border-white/8 bg-[#0a0a18] p-3 cursor-pointer hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors group">
                      <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                      {lead.company && <p className="text-[10px] text-gray-500 truncate">{lead.company}</p>}
                      {lead.value > 0 && <p className="text-[10px] text-green-400 font-bold mt-1">{fmtGBP(lead.value)}</p>}
                      <p className="mt-1 text-[9px] text-brand-400/60 opacity-0 group-hover:opacity-100 transition-opacity">View details →</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedLead(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-[#0e0e1a] border-l border-white/8 flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="min-w-0"><p className="text-sm font-bold text-white truncate">{selectedLead.name}</p>{selectedLead.company && <p className="text-xs text-gray-400 truncate">{selectedLead.company}</p>}</div>
                <button onClick={() => setSelectedLead(null)} className="ml-4 text-gray-400 hover:text-white text-lg leading-none">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-2">
                  {selectedLead.email && <div className="flex justify-between text-xs"><span className="text-gray-400">Email</span><a href={`mailto:${selectedLead.email}`} className="text-brand-400 hover:underline truncate max-w-[200px]">{selectedLead.email}</a></div>}
                  {selectedLead.source && <div className="flex justify-between text-xs"><span className="text-gray-400">Source</span><span className="text-white">{selectedLead.source}</span></div>}
                  <div className="flex justify-between text-xs"><span className="text-gray-400">Value</span><span className="text-green-400 font-bold">{fmtGBP(selectedLead.value)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-400">Added</span><span className="text-white">{new Date(selectedLead.createdAt).toLocaleDateString("en-GB")}</span></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">Move to stage</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(STAGE_META) as Stage[]).map((s) => (<button key={s} onClick={() => moveLead(selectedLead.id, s)} className={`rounded-full px-3 py-1 text-[10px] font-bold border transition-colors ${STAGE_META[s].color} border-current hover:opacity-90`}>{STAGE_META[s].label}</button>))}
                  </div>
                </div>
                {selectedLead.notes && <div><p className="text-xs font-bold text-gray-400 mb-1.5">Notes</p><p className="text-xs text-gray-300 rounded-xl border border-white/6 bg-white/2 p-3 whitespace-pre-wrap">{selectedLead.notes}</p></div>}
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">Log activity</p>
                  <form onSubmit={addActivity} className="space-y-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {(["NOTE","EMAIL","CALL","MEETING","TASK"] as ActivityType[]).map((t) => (<button key={t} type="button" onClick={() => setActType(t)} className={`rounded-full px-3 py-1 text-[10px] font-bold border transition-colors ${actType === t ? "border-brand-500 bg-brand-500/20 text-brand-300" : "border-white/8 text-gray-400 hover:text-white"}`}>{ACTIVITY_ICONS[t]} {t}</button>))}
                    </div>
                    <div className="flex gap-2">
                      <input value={actNote} onChange={(e) => setActNote(e.target.value)} placeholder="Add a note, call log, or task..." className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-white outline-none focus:border-brand-500/50" />
                      <button type="submit" disabled={savingAct || !actNote.trim()} className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-40">Log</button>
                    </div>
                  </form>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2">Activity</p>
                  {activities.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No activity yet — log your first interaction above.</p> : (
                    <div className="space-y-2">{activities.map((a) => (<div key={a.id} className="flex gap-3 rounded-xl border border-white/6 bg-white/2 p-3"><span className="text-sm mt-0.5">{ACTIVITY_ICONS[a.type as ActivityType] ?? "📝"}</span><div className="min-w-0"><p className="text-xs text-white whitespace-pre-wrap break-words">{a.note}</p><p className="text-[10px] text-gray-500 mt-1">{a.type} · {timeAgo(a.createdAt)}</p></div></div>))}</div>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-white/8">
                <button onClick={() => deleteLead(selectedLead.id)} className="w-full rounded-xl border border-red-500/20 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors">Delete lead</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/8 bg-[#0e0e1a] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Add new lead</h2>
            <form onSubmit={addLead} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name *" className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
                <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Value (£)" type="number" min="0" className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })} className="rounded-xl border border-white/8 bg-[#0e0e1a] px-3 py-2.5 text-sm text-white outline-none">{(Object.keys(STAGE_META) as Stage[]).map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}</select>
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source" className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none" />
              </div>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={2} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none resize-none" />
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={adding} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">{adding ? "Adding..." : "Add lead"}</button>
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-xl border border-white/8 px-4 py-2.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
