"use client";
import { useCallback, useEffect, useState } from "react";

interface Item { id: string; type: string; platform: string | null; title: string; content: string; metadata: string | null; status: string }
export default function ApprovalQueueClient() {
  const [status, setStatus] = useState("PENDING");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/content-queue?status=${status}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load the queue.");
      setItems(data.items);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not connect. Try refreshing."); }
    finally { setBusy(false); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);
  async function act(item: Item, action: "approve" | "reject" | "edit") {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/content-queue/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, content: item.content }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The action failed.");
      setMessage(data.message ?? (data.status === "SENT" ? "Email accepted by the provider." : action === "edit" ? "Draft saved." : "Draft rejected."));
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Connection failed. Refresh to check the draft status before trying again."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-4xl text-white">
    <h1 className="text-2xl font-bold">Approval Queue</h1>
    <p className="mt-2 text-sm text-gray-400">Review each draft and recipient. Approving an email sends it; social and PR drafts are approved for manual publication.</p>
    <div className="my-5 flex flex-wrap gap-3">
      <select aria-label="Queue status" value={status} disabled={busy} onChange={event => setStatus(event.target.value)} className="rounded-lg bg-slate-900 border border-white/20 p-2">{["PENDING", "APPROVED", "REJECTED", "SENT"].map(value => <option key={value}>{value}</option>)}</select>
      <button disabled={busy} onClick={() => void load()} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-50">{busy ? "Loading…" : "Refresh"}</button>
    </div>
    {error && <p role="alert" className="mb-4 text-red-400">{error}</p>}
    {message && <p role="status" className="mb-4 text-green-400">{message}</p>}
    {!busy && !error && items.length === 0 && <p className="text-gray-400">No {status.toLowerCase()} drafts.</p>}
    <div className="space-y-5">{items.map(item => {
      let recipient = ""; try { recipient = JSON.parse(item.metadata ?? "{}").toEmail ?? ""; } catch { /* API validates before approval. */ }
      const email = ["email", "lead_followup", "cold_outreach"].includes(item.type) && !!recipient;
      return <article key={item.id} className="rounded-xl border border-white/15 bg-white/5 p-5">
        <h2 className="font-semibold">{item.title}</h2><p className="my-2 text-sm text-gray-400">{item.type} · {recipient ? `To: ${recipient}` : item.platform ?? "Manual publication"}</p>
        <textarea aria-label={`Draft: ${item.title}`} value={item.content} readOnly={item.status !== "PENDING"} onChange={event => setItems(previous => previous.map(entry => entry.id === item.id ? { ...entry, content: event.target.value } : entry))} className="min-h-48 w-full rounded-lg bg-slate-950 border border-white/20 p-3 text-base" />
        {item.status === "PENDING" && <div className="mt-3 flex flex-wrap gap-3">
          <button disabled={busy || !item.content.trim()} onClick={() => void act(item, "edit")} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-50">Save draft</button>
          <button disabled={busy || !item.content.trim()} onClick={() => void act(item, "approve")} className="rounded-lg bg-indigo-600 px-4 py-2 disabled:opacity-50">{email ? "Approve and send email" : "Approve for manual publication"}</button>
          <button disabled={busy} onClick={() => void act(item, "reject")} className="rounded-lg border border-red-400/30 px-4 py-2 text-red-300 disabled:opacity-50">Reject</button>
        </div>}
      </article>;
    })}</div>
  </div>;
}
