"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QueueItem {
  id: string;
  type: string;
  platform: string | null;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  metadata: string | null;
}

interface Campaign {
  id: string;
  name: string;
  industry: string | null;
  subject: string;
  sentCount: number;
  _count: { contacts: number };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
  aiDraft: string | null;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  social_post: "Social Post",
  email: "Email",
  lead_followup: "Lead Follow-up",
  pr: "PR / Press",
};

const TYPE_ICONS: Record<string, string> = {
  social_post: "📱",
  email: "📧",
  lead_followup: "🎯",
  pr: "📰",
};

export default function CommandCentreClient() {
  const [tab, setTab] = useState<"approvals" | "outreach">("approvals");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New campaign form
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignIndustry, setCampaignIndustry] = useState("");
  const [contactsCsv, setContactsCsv] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content-queue?status=PENDING");
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    const res = await fetch("/api/outreach/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns ?? []);
  }, []);

  const loadContacts = useCallback(async (campaignId: string) => {
    const res = await fetch(`/api/outreach/campaigns/${campaignId}/contacts`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
  }, []);

  useEffect(() => {
    if (tab === "approvals") loadQueue();
    else loadCampaigns();
  }, [tab, loadQueue, loadCampaigns]);

  useEffect(() => {
    if (selectedCampaign) loadContacts(selectedCampaign);
  }, [selectedCampaign, loadContacts]);

  async function handleAction(id: string, action: "approve" | "reject", content?: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/content-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content }),
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setEditingId(null);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveAll() {
    setActionLoading("all");
    try {
      await Promise.all(items.map((item) => fetch(`/api/content-queue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })));
      setItems([]);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleOutreachApprove(contactIds: string[]) {
    setActionLoading("outreach");
    try {
      await fetch("/api/outreach/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds, action: "approve" }),
      });
      if (selectedCampaign) loadContacts(selectedCampaign);
    } finally {
      setActionLoading(null);
    }
  }

  async function createCampaignAndGenerate() {
    if (!campaignName || !campaignSubject || !contactsCsv.trim()) return;
    setGenerating(true);
    try {
      // Create campaign
      const cRes = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: campaignName, subject: campaignSubject, industry: campaignIndustry }),
      });
      const cData = await cRes.json();
      const campaignId = cData.campaign.id;

      // Parse CSV: Name, Email, Company (one per line)
      const contacts = contactsCsv.trim().split("\n").map((line) => {
        const [name, email, company, industry] = line.split(",").map((s) => s.trim());
        return { name, email, company, industry };
      }).filter((c) => c.name && c.email);

      await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, contacts }),
      });

      setShowNewCampaign(false);
      setCampaignName(""); setCampaignSubject(""); setCampaignIndustry(""); setContactsCsv("");
      await loadCampaigns();
      setSelectedCampaign(campaignId);
    } finally {
      setGenerating(false);
    }
  }

  const pendingContacts = contacts.filter((c) => c.status === "PENDING_APPROVAL");

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Command Centre</h1>
          <p className="text-gray-400 mt-1">Everything queued for your approval. You approve, AI sends.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "approvals", label: `Approval Queue${items.length > 0 ? ` (${items.length})` : ""}`, icon: "✅" },
            { id: "outreach", label: "Outreach Campaigns", icon: "📨" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as never)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── APPROVAL QUEUE ── */}
        {tab === "approvals" && (
          <div className="space-y-4">
            {items.length > 0 && (
              <div className="flex justify-end">
                <button onClick={handleApproveAll} disabled={actionLoading === "all"}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {actionLoading === "all" ? "Sending all…" : `✓ Approve all ${items.length}`}
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-gray-500">Loading queue…</div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/2">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-white font-semibold text-lg">Queue is clear</p>
                <p className="text-gray-500 text-sm mt-1">All caught up — new items will appear here automatically</p>
              </div>
            ) : (
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                    className="rounded-2xl border border-white/8 bg-gray-900 p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{TYPE_ICONS[item.type] ?? "📄"}</span>
                        <div>
                          <p className="text-white font-semibold">{item.title}</p>
                          <p className="text-xs text-gray-500">{TYPE_LABELS[item.type] ?? item.type}{item.platform ? ` · ${item.platform}` : ""} · {new Date(item.createdAt).toLocaleString("en-GB")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingId(item.id); setEditContent(item.content); }}
                          className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-600 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleAction(item.id, "reject")} disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">
                          Reject
                        </button>
                        <button onClick={() => handleAction(item.id, "approve")} disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors">
                          {actionLoading === item.id ? "Sending…" : "✓ Approve & Send"}
                        </button>
                      </div>
                    </div>

                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                          rows={6} className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(item.id, "approve", editContent)}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700">
                            ✓ Save & Send
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-gray-800/50 rounded-xl px-4 py-3">
                        {item.content}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* ── OUTREACH CAMPAIGNS ── */}
        {tab === "outreach" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-400 text-sm">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
              <button onClick={() => setShowNewCampaign(true)}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors">
                + New Campaign
              </button>
            </div>

            {/* New campaign form */}
            <AnimatePresence>
              {showNewCampaign && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-brand-500/30 bg-gray-900 p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">New Outreach Campaign</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Campaign name</label>
                      <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-gray-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="e.g. UK Dentists July" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Industry (optional)</label>
                      <input value={campaignIndustry} onChange={(e) => setCampaignIndustry(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-gray-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="e.g. dental, property, trades" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Email subject line</label>
                    <input value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-gray-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. Quick idea for your practice" />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Contacts — one per line: <span className="text-gray-500">Name, Email, Company (optional)</span></label>
                    <textarea value={contactsCsv} onChange={(e) => setContactsCsv(e.target.value)}
                      rows={6} className="w-full rounded-xl border border-white/10 bg-gray-800 px-3 py-2.5 text-sm text-white font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder={"John Smith, john@smithdental.co.uk, Smith Dental\nSarah Jones, sarah@jonesestate.com, Jones Estate Agents"} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={createCampaignAndGenerate} disabled={generating || !campaignName || !campaignSubject || !contactsCsv.trim()}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-40 transition-colors">
                      {generating ? "AI writing emails…" : "🤖 Generate AI Emails"}
                    </button>
                    <button onClick={() => setShowNewCampaign(false)}
                      className="px-4 py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm hover:bg-gray-600">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Campaign list */}
            <div className="grid gap-4">
              {campaigns.map((c) => (
                <div key={c.id} className={`rounded-2xl border p-5 cursor-pointer transition-colors ${selectedCampaign === c.id ? "border-brand-500 bg-brand-500/5" : "border-white/8 bg-gray-900 hover:border-white/20"}`}
                  onClick={() => setSelectedCampaign(selectedCampaign === c.id ? null : c.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{c.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.subject}{c.industry ? ` · ${c.industry}` : ""}</p>
                    </div>
                    <div className="flex gap-4 text-center text-xs text-gray-400">
                      <div><p className="text-white font-bold text-lg">{c._count.contacts}</p><p>contacts</p></div>
                      <div><p className="text-white font-bold text-lg">{c.sentCount}</p><p>sent</p></div>
                    </div>
                  </div>

                  {/* Contacts panel */}
                  <AnimatePresence>
                    {selectedCampaign === c.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-5 space-y-3 overflow-hidden">
                        {pendingContacts.length > 0 && (
                          <div className="flex justify-end">
                            <button onClick={(e) => { e.stopPropagation(); handleOutreachApprove(pendingContacts.map((c) => c.id)); }}
                              disabled={actionLoading === "outreach"}
                              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                              {actionLoading === "outreach" ? "Sending…" : `✓ Send all ${pendingContacts.length} emails`}
                            </button>
                          </div>
                        )}

                        {contacts.map((contact) => (
                          <div key={contact.id} className="rounded-xl border border-white/5 bg-gray-800 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-white text-sm font-medium">{contact.name}</p>
                                <p className="text-xs text-gray-500">{contact.email}{contact.company ? ` · ${contact.company}` : ""}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  contact.status === "SENT" ? "bg-green-500/20 text-green-400" :
                                  contact.status === "PENDING_APPROVAL" ? "bg-amber-500/20 text-amber-400" :
                                  contact.status === "FAILED" ? "bg-red-500/20 text-red-400" :
                                  "bg-gray-700 text-gray-400"
                                }`}>{contact.status.replace("_", " ")}</span>
                                {contact.status === "PENDING_APPROVAL" && (
                                  <button onClick={(e) => { e.stopPropagation(); handleOutreachApprove([contact.id]); }}
                                    className="px-2 py-1 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700">
                                    Send
                                  </button>
                                )}
                              </div>
                            </div>
                            {contact.aiDraft && (
                              <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 whitespace-pre-wrap">{contact.aiDraft}</p>
                            )}
                          </div>
                        ))}

                        {contacts.length === 0 && (
                          <p className="text-center text-gray-500 text-sm py-4">Loading contacts…</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {campaigns.length === 0 && !showNewCampaign && (
                <div className="text-center py-16 rounded-2xl border border-white/5">
                  <p className="text-4xl mb-3">📨</p>
                  <p className="text-white font-semibold">No campaigns yet</p>
                  <p className="text-gray-500 text-sm mt-1">Create one — paste in contacts, AI writes personalised emails, you approve</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
