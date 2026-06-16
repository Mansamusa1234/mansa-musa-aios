"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Entry {
  id: string;
  userName: string | null;
  userEmail: string;
  sourceType: string;
  amountCents: number;
  status: string;
  createdAt: Date;
}

interface Props {
  entries: Entry[];
  totals: { pendingCents: number; approvedCents: number; paidCents: number };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-500/15 text-gray-400",
  APPROVED: "bg-blue-500/15 text-blue-300",
  PAID: "bg-green-500/15 text-green-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

const ACTIONS: Record<string, { action: string; label: string }[]> = {
  PENDING: [{ action: "approve", label: "Approve" }, { action: "reject", label: "Reject" }],
  APPROVED: [{ action: "mark-paid", label: "Mark Paid" }],
  PAID: [],
  REJECTED: [],
};

function money(cents: number): string {
  return `£${(cents / 100).toFixed(2)}`;
}

export default function CommissionsClient({ entries, totals }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function runAction(id: string, action: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/commissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Commissions</h1>
      <p className="mt-1 text-sm text-gray-500">
        Referral and affiliate commissions awaiting review. Nothing is paid automatically — approve, then mark paid once you've sent the money yourself.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
          <p className="text-xl font-extrabold text-gray-300">{money(totals.pendingCents)}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Pending review</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
          <p className="text-xl font-extrabold text-blue-400">{money(totals.approvedCents)}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Approved, owed</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
          <p className="text-xl font-extrabold text-green-400">{money(totals.paidCents)}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Paid out</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <table className="w-full text-sm">
          <thead className="border-b border-white/6 bg-white/3">
            <tr>
              {["User", "Source", "Amount", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600">No commission entries yet.</td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{e.userName ?? "—"}</p>
                  <p className="text-xs text-gray-600">{e.userEmail}</p>
                </td>
                <td className="px-4 py-3 text-gray-400">{e.sourceType}</td>
                <td className="px-4 py-3 font-semibold text-white">{money(e.amountCents)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[e.status] ?? STATUS_STYLES.PENDING}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {ACTIONS[e.status]?.map((a) => (
                      <button
                        key={a.action}
                        onClick={() => runAction(e.id, a.action)}
                        disabled={busyId === e.id}
                        className="rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-white/8 disabled:opacity-50 transition-colors"
                      >
                        {busyId === e.id ? "…" : a.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
