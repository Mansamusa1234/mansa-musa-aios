"use client";

import { useEffect, useState } from "react";

const TRIGGERS = [
  { value: "LEAD_CREATED",            label: "New lead captured" },
  { value: "BOOKING_CONFIRMED",       label: "Booking confirmed" },
  { value: "BOOKING_CANCELLED",       label: "Booking cancelled" },
  { value: "TRIAL_STARTED",           label: "Free trial started" },
  { value: "TRIAL_ENDING",            label: "Trial ending soon" },
  { value: "SUBSCRIPTION_ACTIVATED",  label: "Subscription activated" },
  { value: "SUBSCRIPTION_CANCELLED",  label: "Subscription cancelled" },
  { value: "MANUAL",                  label: "Manual / API trigger" },
];

interface Step { stepOrder: number; delayHours: number; subject: string; bodyHtml: string }
interface Workflow { id: string; name: string; trigger: string; isActive: boolean; steps: Step[]; _count: { runs: number } }

const blankStep = (): Step => ({ stepOrder: 0, delayHours: 0, subject: "", bodyHtml: "" });

export default function EmailAutomationPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [creating, setCreating]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // New workflow form state
  const [name, setName]       = useState("");
  const [trigger, setTrigger] = useState("LEAD_CREATED");
  const [steps, setSteps]     = useState<Step[]>([blankStep()]);

  async function load() {
    const res = await fetch("/api/email-workflows");
    if (res.ok) setWorkflows((await res.json()).workflows);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        trigger,
        isActive: true,
        steps: steps.map((s, i) => ({ ...s, stepOrder: i })),
      };
      const res = await fetch("/api/email-workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { setError("Failed to save workflow"); return; }
      setName(""); setTrigger("LEAD_CREATED"); setSteps([blankStep()]); setCreating(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/email-workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    await load();
  }

  async function deleteWorkflow(id: string) {
    if (!confirm("Delete this workflow?")) return;
    await fetch(`/api/email-workflows/${id}`, { method: "DELETE" });
    await load();
  }

  function updateStep(i: number, field: keyof Step, value: string | number) {
    setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Automation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Build trigger-based sequences. Use <code className="text-xs font-mono">{"{{name}}"}</code> and <code className="text-xs font-mono">{"{{email}}"}</code> as variables.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          + New workflow
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form onSubmit={handleSave} className="rounded-2xl border border-gray-700 bg-gray-900 p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">New workflow</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Workflow name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. New lead welcome sequence" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Trigger</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Steps</p>
            {steps.map((step, i) => (
              <div key={i} className="rounded-xl border border-gray-700 bg-gray-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">Step {i + 1}</span>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => setSteps((p) => p.filter((_, idx) => idx !== i))}
                      className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Send after (hours)</label>
                    <input type="number" min={0} value={step.delayHours}
                      onChange={(e) => updateStep(i, "delayHours", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Subject</label>
                    <input required value={step.subject} onChange={(e) => updateStep(i, "subject", e.target.value)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Hi {{name}}, here's what's next…" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email body (HTML or plain text)</label>
                  <textarea required rows={4} value={step.bodyHtml} onChange={(e) => updateStep(i, "bodyHtml", e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    placeholder="<p>Hi {{name}}, thanks for signing up…</p>" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setSteps((p) => [...p, { ...blankStep(), stepOrder: p.length }])}
              className="text-sm text-brand-400 hover:text-brand-300">+ Add step</button>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
              {saving ? "Saving…" : "Save workflow"}
            </button>
          </div>
        </form>
      )}

      {/* Workflow list */}
      {workflows.length === 0 && !creating && (
        <div className="rounded-2xl border border-dashed border-gray-700 py-16 text-center text-gray-500">
          <p className="text-4xl mb-3">📧</p>
          <p className="text-sm">No workflows yet. Create one to start automating follow-ups.</p>
        </div>
      )}

      <div className="space-y-3">
        {workflows.map((wf) => (
          <div key={wf.id} className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900 px-5 py-4 gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{wf.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {TRIGGERS.find((t) => t.value === wf.trigger)?.label} · {wf.steps.length} step{wf.steps.length !== 1 ? "s" : ""} · {wf._count.runs} runs
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => toggleActive(wf.id, wf.isActive)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${wf.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                {wf.isActive ? "Active" : "Paused"}
              </button>
              <button onClick={() => deleteWorkflow(wf.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
