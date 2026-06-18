"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

type Stage = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  value: number;
  source: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineCol { stage: Stage; leads: LeadRow[] }

interface Props {
  pipeline: PipelineCol[];
  totalLeads: number;
  totalValue: number;
  wonCount: number;
  pipelineValue: number;
}

const STAGE_META: Record<Stage, { label: string; color: string; dot: string }> = {
  NEW:       { label: "New",       color: "border-gray-500/30 bg-gray-500/5",   dot: "bg-gray-400" },
  CONTACTED: { label: "Contacted", color: "border-blue-500/30 bg-blue-500/5",   dot: "bg-blue-400" },
  QUALIFIED: { label: "Qualified", color: "border-brand-500/30 bg-brand-500/5", dot: "bg-brand-400" },
  PROPOSAL:  { label: "Proposal",  color: "border-amber-500/30 bg-amber-500/5", dot: "bg-amber-400" },
  WON:       { label: "Won",       color: "border-green-500/30 bg-green-500/5", dot: "bg-green-400" },
  LOST:      { label: "Lost",      color: "border-red-500/30 bg-red-500/5",     dot: "bg-red-400"   },
};

export default function CRMContent({ pipeline, totalLeads, totalValue, wonCount, pipelineValue }: Props) {
  const [cols, setCols] = useState(pipeline);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", value: "0", source: "", notes: "", stage: "NEW" as Stage });
  const [dragId, setDragId] = useState<string | null>(null);

  const fmtGBP = (p: number) => `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, value: parseInt(form.value, 10) * 100 }),
    });
    const data = await res.json();
    if (res.ok && data.lead) {
      setCols((prev) => prev.map((col) => col.stage === data.lead.stage ? { ...col, leads: [data.lead, ...col.leads] } : col));
      setShowAdd(false);
      setForm({ name: "", email: "", company: "", phone: "", value: "0", source: "", notes: "", stage: "NEW" });
    }
    setAdding(false);
  }

  async function moveLead(leadId: string, toStage: Stage) {
    const res = await fetch(`/api/crm/leads/${leadId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: toStage }) });
    if (res.ok) {
      setCols((prev) => {
        let moved: LeadRow | undefined;
        const next = prev.map((col) => {
          const leads = col.leads.filter((l) => { if (l.id === leadId) { moved = l; return false; } return true; });
          return { ...col, leads };
        });
        return next.map((col) => col.stage === toStage && moved ? { ...col, leads: [moved, ...col.leads] } : col);
      });
    }
  }

  async function deleteLead(id: string) {
    await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
    setCols((prev) => prev.map((col) => ({ ...col, leads: col.leads.filter((l) => l.id !== id) })));
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· CRM ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Lead Pipeline</h1>
          <p className="mt-1 text-sm text-gray-500">Track your leads from first contact to closed deal.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shrink-0">
          + Add Lead
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total leads", value: totalLeads.toString() },
          { label: "Pipeline value", value: fmtGBP(pipelineValue) },
          { label: "Deals won", value: wonCount.toString() },
          { label: "Revenue closed", value: fmtGBP(totalValue) },
        ].map((s) => (
          <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-xl font-extrabold text-brand-400">{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {cols.map(({ stage, leads }) => {
            const meta = STAGE_META[stage];
            return (
              <div
                key={stage}
                className={`w-56 rounded-2xl border p-3 ${meta.color} flex-shrink-0`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (dragId) moveLead(dragId, stage); setDragId(null); }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <p className="text-xs font-bold text-gray-300">{meta.label}</p>
                  <span className="ml-auto text-[10px] text-gray-400 bg-white/5 rounded-full px-2 py-0.5">{leads.length}</span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDragId(lead.id)}
                      className="rounded-xl border border-white/8 bg-[#0a0a18] p-3 cursor-grab active:cursor-grabbing group"
                    >
                      <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                      {lead.company && <p className="text-[10px] text-gray-500 truncate">{lead.company}</p>}
                      {lead.value > 0 && <p className="text-[10px] text-green-400 font-bold mt-1">{fmtGBP(lead.value)}</p>}
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="mt-1.5 text-[9px] text-red-500/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lead Modal */}
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
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })} className="rounded-xl border border-white/8 bg-[#0e0e1a] px-3 py-2.5 text-sm text-white outline-none">
                  {(Object.keys(STAGE_META) as Stage[]).map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                </select>
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
