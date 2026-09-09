"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaidAdsControls({ approvals }: { approvals: Array<{ id: string; campaignName: string; platform?: string; budgetChangePct?: number }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(path: string, key: string, body?: unknown) {
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      if (json.results) {
        const summary = json.results.map((r: any) => `${r.platform}: ${r.error ? `error — ${r.error}` : r.configured ? `${r.synced} synced` : "not configured"}`).join(" · ");
        setMessage(summary);
      } else {
        setMessage(json.status || "Complete");
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => run("/api/ads/sync", "sync")} disabled={!!busy} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy === "sync" ? "Syncing…" : "Sync Meta + Google + TikTok + Stripe"}
        </button>
        <button onClick={() => run("/api/ads/analyze", "analyze")} disabled={!!busy} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 disabled:opacity-50">
          {busy === "analyze" ? "Analysing…" : "Run Growth Agent"}
        </button>
      </div>
      {message && <p className="rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-xs leading-5 text-gray-300">{message}</p>}

      {approvals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">Pending spend approvals</h3>
          {approvals.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-100">{a.campaignName}</p>
                <p className="text-xs text-gray-400">{a.platform || "Ad platform"} · proposed budget {a.budgetChangePct && a.budgetChangePct > 0 ? "+" : ""}{a.budgetChangePct ?? 0}%</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => run("/api/ads/actions", `reject-${a.id}`, { approvalId: a.id, approve: false })} disabled={!!busy} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300">Reject</button>
                <button onClick={() => run("/api/ads/actions", `approve-${a.id}`, { approvalId: a.id, approve: true })} disabled={!!busy} className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300">Approve & execute</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
