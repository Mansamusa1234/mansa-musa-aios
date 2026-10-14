"use client";

import { useState, useEffect } from "react";
import type { ChannelStatus, ChannelState } from "@/lib/marketingStatus";

interface LeaderRow {
  name: string | null;
  email: string;
  conversions: number;
}

interface Campaign {
  id: string;
  subject: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface Props {
  channels: ChannelStatus[];
  leaderboard: LeaderRow[];
  subscriberCount: number;
  pushSubscriberCount: number;
  couponCount: number;
  totalReferrals: number;
  totalAffiliates: number;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
      <p className="text-xl font-extrabold text-brand-400">{value.toLocaleString()}</p>
      <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

const STATE_LABEL: Record<ChannelState, string> = {
  connected: "Connected",
  ready: "Ready",
  reconnect: "Reconnect required",
  setup: "Setup required",
  coming_soon: "Coming soon",
};
const STATE_STYLE: Record<ChannelState, string> = {
  connected: "bg-green-500/15 text-green-400",
  ready: "bg-blue-500/15 text-blue-300",
  reconnect: "bg-amber-500/15 text-amber-300",
  setup: "bg-white/8 text-gray-300",
  coming_soon: "bg-purple-500/15 text-purple-300",
};

export default function MarketingClient({ channels, leaderboard, subscriberCount, pushSubscriberCount, couponCount, totalReferrals, totalAffiliates }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignForm, setCampaignForm] = useState({ subject: "", bodyHtml: "" });
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignMessage, setCampaignMessage] = useState("");

  const [pushForm, setPushForm] = useState({ title: "", body: "", url: "" });
  const [sendingPush, setSendingPush] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/campaigns").then(async (res) => {
      if (res.ok) setCampaigns((await res.json()).campaigns);
    });
  }, []);

  async function sendCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSendingCampaign(true);
    setCampaignMessage("");
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignForm),
    });
    const data = await res.json();
    setSendingCampaign(false);
    if (!res.ok) {
      setCampaignMessage(data.error ?? "Failed to send.");
      return;
    }
    setCampaignMessage(`Sent to ${data.campaign.sentCount} of ${data.campaign.recipientCount} subscribers.`);
    setCampaignForm({ subject: "", bodyHtml: "" });
    fetch("/api/admin/campaigns").then(async (res) => { if (res.ok) setCampaigns((await res.json()).campaigns); });
  }

  async function sendPush(e: React.FormEvent) {
    e.preventDefault();
    setSendingPush(true);
    setPushMessage("");
    const res = await fetch("/api/admin/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pushForm),
    });
    const data = await res.json();
    setSendingPush(false);
    if (!res.ok) {
      setPushMessage(data.error ?? "Failed to send.");
      return;
    }
    setPushMessage(`Sent to ${data.sent} devices (${data.failed} failed).`);
    setPushForm({ title: "", body: "", url: "" });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketing</h1>
        <p className="mt-1 text-sm text-gray-500">Channel status, newsletter, push notifications, and the referral leaderboard.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Newsletter subscribers" value={subscriberCount} />
        <StatCard label="Push subscribers" value={pushSubscriberCount} />
        <StatCard label="Promo codes" value={couponCount} />
        <StatCard label="Total referrals" value={totalReferrals} />
        <StatCard label="Total affiliates" value={totalAffiliates} />
      </div>

      {/* Channel status */}
      <div>
        <h2 className="mb-1 text-sm font-bold text-white">📡 Marketing channels</h2>
        <p className="mb-3 text-xs text-gray-500">Checked when this page loads. Nothing is posted or sent from here.</p>
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3 divide-y divide-white/5">
          {channels.map((ch) => (
            <div key={ch.key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{ch.name} <span className="ml-1 text-[10px] font-normal uppercase tracking-wider text-gray-500">{ch.group}</span></p>
                <p className="text-xs text-gray-400">{ch.detail}</p>
                {ch.action && <p className="mt-0.5 text-xs text-gray-500">{ch.action}</p>}
              </div>
              <span className={`shrink-0 self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATE_STYLE[ch.state]}`}>{STATE_LABEL[ch.state]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-white">🏆 Referral Leaderboard</h2>
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
          {leaderboard.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-600">No conversions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/6">
                <tr>
                  {["#", "Name", "Email", "Conversions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {leaderboard.map((l, i) => (
                  <tr key={l.email} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{l.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-400">{l.email}</td>
                    <td className="px-4 py-2.5 font-bold text-brand-400">{l.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Newsletter campaign */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-white">📧 Send Newsletter Campaign</h2>
          <form onSubmit={sendCampaign} className="space-y-3 rounded-2xl border border-white/8 bg-white/3 p-5">
            {campaignMessage && <div className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-300">{campaignMessage}</div>}
            <input
              value={campaignForm.subject}
              onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
              placeholder="Subject"
              required
              className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
            />
            <textarea
              value={campaignForm.bodyHtml}
              onChange={(e) => setCampaignForm({ ...campaignForm, bodyHtml: e.target.value })}
              placeholder="Email body (HTML allowed)"
              rows={5}
              required
              className="w-full resize-none rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
            />
            <button
              type="submit"
              disabled={sendingCampaign}
              className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {sendingCampaign ? "Sending…" : `Send to ${subscriberCount} subscribers`}
            </button>
          </form>

          {campaigns.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {campaigns.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/2 px-3 py-2 text-xs">
                  <span className="text-gray-300 truncate">{c.subject}</span>
                  <span className="flex-shrink-0 text-gray-600">{c.sentCount}/{c.recipientCount} sent</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Push notification */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-white">🔔 Send Push Notification</h2>
          <form onSubmit={sendPush} className="space-y-3 rounded-2xl border border-white/8 bg-white/3 p-5">
            {pushMessage && <div className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-300">{pushMessage}</div>}
            <input
              value={pushForm.title}
              onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
              placeholder="Notification title"
              required
              className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
            />
            <textarea
              value={pushForm.body}
              onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })}
              placeholder="Message"
              rows={3}
              required
              className="w-full resize-none rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
            />
            <input
              value={pushForm.url}
              onChange={(e) => setPushForm({ ...pushForm, url: e.target.value })}
              placeholder="Link when clicked (optional, e.g. /billing)"
              className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-500/40"
            />
            <button
              type="submit"
              disabled={sendingPush}
              className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {sendingPush ? "Sending…" : `Send to ${pushSubscriberCount} devices`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
