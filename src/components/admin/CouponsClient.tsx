"use client";

import { useState, useEffect } from "react";

interface Coupon {
  id: string;
  code: string;
  active: boolean;
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: number | null;
  percentOff: number | null;
  amountOff: number | null;
  duration: string;
}

export default function CouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", percentOff: "20", maxRedemptions: "", expiresInDays: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    if (res.ok) setCoupons(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create promo code.");
      return;
    }
    setForm({ code: "", percentOff: "20", maxRedemptions: "", expiresInDays: "" });
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Promo Codes</h1>
      <p className="mt-1 text-sm text-gray-500">Create and manage Stripe promotion codes. Customers enter these at checkout.</p>

      <form onSubmit={createCoupon} className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-white/3 p-5 sm:grid-cols-4">
        {error && <div className="col-span-full rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">Code</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="LAUNCH20"
            required
            className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">% off</label>
          <input
            type="number" min="1" max="100"
            value={form.percentOff}
            onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
            required
            className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Max uses</label>
          <input
            type="number" min="1"
            value={form.maxRedemptions}
            onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
            placeholder="Unlimited"
            className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Expires in (days)</label>
          <input
            type="number" min="1"
            value={form.expiresInDays}
            onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}
            placeholder="Never"
            className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
          />
        </div>
        <div className="col-span-full flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating…" : "Create promo code"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <table className="w-full text-sm">
          <thead className="border-b border-white/6 bg-white/3">
            <tr>
              {["Code", "Discount", "Used", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">Loading…</td></tr>
            )}
            {!loading && coupons.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600">No promo codes yet.</td></tr>
            )}
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-white">{c.code}</td>
                <td className="px-4 py-3 text-gray-400">
                  {c.percentOff ? `${c.percentOff}% off` : c.amountOff ? `£${(c.amountOff / 100).toFixed(2)} off` : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400">{c.timesRedeemed}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.active ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c.id, !c.active)}
                    className="rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/8 transition-colors"
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
