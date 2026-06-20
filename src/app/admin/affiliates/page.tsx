"use client";

import { useState, useEffect } from "react";

interface AffiliateRow {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  code: string;
  couponCode: string | null;
  tier: string;
  status: string;
  commissionRate: number;
  clicks: number;
  conversions: number;
  totalEarnedCents: number;
  createdAt: string;
}

interface PayoutRow {
  id: string;
  amountCents: number;
  status: string;
  method: string;
  notes: string | null;
  createdAt: string;
  affiliate: {
    code: string;
    user: { name: string | null; email: string };
  };
}

function gbp(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"affiliates" | "payouts">("affiliates");
  const [saving, setSaving] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/admin/affiliates");
    const data = await res.json() as { affiliates: AffiliateRow[]; payoutRequests: PayoutRow[] };
    setAffiliates(data.affiliates ?? []);
    setPayouts(data.payoutRequests ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateAffiliate(affiliateId: string, patch: { status?: string; commissionRate?: number }) {
    setSaving(affiliateId);
    await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliateId, action: "update", ...patch }),
    });
    await load();
    setSaving(null);
  }

  async function processPayout(payoutId: string, action: "approve" | "pay" | "reject") {
    setSaving(payoutId);
    await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId, action, adminNote: adminNote[payoutId] }),
    });
    await load();
    setSaving(null);
  }

  const totalEarned   = affiliates.reduce((s, a) => s + a.totalEarnedCents, 0);
  const pendingPayout = payouts.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Affiliate Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage affiliates, commissions, and payouts.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total affiliates",    value: affiliates.length.toString() },
          { label: "Total commissions",   value: gbp(totalEarned) },
          { label: "Pending payouts",     value: gbp(pendingPayout) },
          { label: "Pending requests",    value: payouts.filter((p) => p.status === "PENDING").length.toString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-[#0a0a18] p-4">
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/8">
        {(["affiliates", "payouts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? "border-indigo-500 text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            {t} {t === "payouts" && payouts.filter((p) => p.status === "PENDING").length > 0 &&
              <span className="ml-1 rounded-full bg-yellow-500 text-black text-xs px-1.5 py-0.5">
                {payouts.filter((p) => p.status === "PENDING").length}
              </span>
            }
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : tab === "affiliates" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/8">
                <th className="pb-2 pr-4">Affiliate</th>
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2 pr-4">Tier</th>
                <th className="pb-2 pr-4">Rate</th>
                <th className="pb-2 pr-4">Clicks</th>
                <th className="pb-2 pr-4">Conversions</th>
                <th className="pb-2 pr-4">Earned</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {affiliates.map((a) => (
                <tr key={a.id} className="text-gray-300">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-white text-xs">{a.userName ?? "—"}</div>
                    <div className="text-xs text-gray-500">{a.userEmail}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-mono text-xs text-indigo-400">{a.code}</div>
                    {a.couponCode && <div className="text-xs text-gray-500">{a.couponCode}</div>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-semibold ${
                      a.tier === "PLATINUM" ? "text-indigo-400" :
                      a.tier === "GOLD"     ? "text-yellow-400" :
                      a.tier === "SILVER"   ? "text-slate-400"  : "text-amber-600"
                    }`}>{a.tier}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      defaultValue={a.commissionRate}
                      min={0} max={50}
                      className="w-16 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs text-white"
                      onBlur={(e) => {
                        const v = parseInt(e.target.value);
                        if (v !== a.commissionRate) updateAffiliate(a.id, { commissionRate: v });
                      }}
                    />%
                  </td>
                  <td className="py-3 pr-4 text-xs">{a.clicks.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-xs">{a.conversions}</td>
                  <td className="py-3 pr-4 text-xs font-semibold text-indigo-300">{gbp(a.totalEarnedCents)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.status === "APPROVED" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                    }`}>{a.status}</span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => updateAffiliate(a.id, { status: a.status === "APPROVED" ? "SUSPENDED" : "APPROVED" })}
                      disabled={saving === a.id}
                      className="text-xs text-gray-400 hover:text-white border border-white/10 rounded px-2 py-1 disabled:opacity-50"
                    >
                      {saving === a.id ? "…" : a.status === "APPROVED" ? "Suspend" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {affiliates.length === 0 && <p className="text-gray-500 text-sm py-8 text-center">No affiliates yet.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.length === 0 && <p className="text-gray-500 text-sm py-8 text-center">No pending payout requests.</p>}
          {payouts.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/8 bg-[#0a0a18] p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-white">{p.affiliate.user.name ?? p.affiliate.user.email}</div>
                  <div className="text-xs text-gray-500">{p.affiliate.user.email} · code: {p.affiliate.code}</div>
                  <div className="text-xs text-gray-500 mt-1">Method: {p.method}</div>
                  {p.notes && <div className="text-xs text-gray-400 mt-1 italic">{p.notes}</div>}
                  <div className="text-xs text-gray-600 mt-1">{new Date(p.createdAt).toLocaleDateString("en-GB")}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{gbp(p.amountCents)}</div>
                  <div className={`text-xs mt-0.5 ${
                    p.status === "PAID"     ? "text-green-400" :
                    p.status === "APPROVED" ? "text-indigo-400" :
                    p.status === "REJECTED" ? "text-red-400"   : "text-yellow-400"
                  }`}>{p.status}</div>
                </div>
              </div>

              {(p.status === "PENDING" || p.status === "APPROVED") && (
                <div className="mt-3 space-y-2">
                  <input
                    placeholder="Admin note (optional)"
                    value={adminNote[p.id] ?? ""}
                    onChange={(e) => setAdminNote((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300"
                  />
                  <div className="flex gap-2">
                    {p.status === "PENDING" && (
                      <button onClick={() => processPayout(p.id, "approve")} disabled={saving === p.id}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs text-white disabled:opacity-50">
                        {saving === p.id ? "…" : "Approve"}
                      </button>
                    )}
                    {p.status === "APPROVED" && (
                      <button onClick={() => processPayout(p.id, "pay")} disabled={saving === p.id}
                        className="rounded-lg bg-green-600 hover:bg-green-500 px-3 py-1.5 text-xs text-white disabled:opacity-50">
                        {saving === p.id ? "…" : "Mark as Paid"}
                      </button>
                    )}
                    <button onClick={() => processPayout(p.id, "reject")} disabled={saving === p.id}
                      className="rounded-lg border border-red-500/30 text-red-400 px-3 py-1.5 text-xs hover:bg-red-500/10 disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
