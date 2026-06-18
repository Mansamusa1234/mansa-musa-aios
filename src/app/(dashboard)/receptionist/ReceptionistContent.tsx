"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

interface ReceptionistData {
  id: string;
  name: string;
  greeting: string;
  persona: string;
  businessHours: string | null;
  widgetColor: string;
  isActive: boolean;
  totalChats: number;
}

interface ChatRow { id: string; visitorName: string | null; visitorEmail: string | null; createdAt: Date }

interface Props {
  receptionist: ReceptionistData | null;
  recentChats: ChatRow[];
}

export default function ReceptionistContent({ receptionist: initial, recentChats }: Props) {
  const [rec, setRec] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "AI Assistant",
    greeting: initial?.greeting ?? "Hello! How can I help you today?",
    persona: initial?.persona ?? "professional, friendly, helpful",
    businessHours: initial?.businessHours ?? "",
    widgetColor: initial?.widgetColor ?? "#6366f1",
    isActive: initial?.isActive ?? true,
  });
  const [activeTab, setActiveTab] = useState<"config" | "preview" | "embed" | "chats">("config");
  const [previewMessages, setPreviewMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: form.greeting },
  ]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewing, setPreviewing] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/receptionist/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) setRec(data.receptionist);
    setSaving(false);
  }

  async function sendPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!previewInput.trim() || !rec) return;
    const newMessages = [...previewMessages, { role: "user" as const, content: previewInput }];
    setPreviewMessages(newMessages);
    setPreviewInput("");
    setPreviewing(true);
    const res = await fetch("/api/receptionist/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receptionistId: rec.id, messages: newMessages.map((m) => ({ role: m.role, content: m.content })) }),
    });
    const data = await res.json();
    if (res.ok) setPreviewMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setPreviewing(false);
  }

  const embedCode = rec
    ? `<script src="https://mansamusaai.vercel.app/receptionist-widget.js" data-id="${rec.id}" data-color="${rec.widgetColor}" defer></script>`
    : "Save your configuration first to generate the embed code.";

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Receptionist ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">AI Receptionist</h1>
          <p className="mt-1 text-sm text-gray-500">Deploy an AI receptionist on your website to capture leads 24/7.</p>
        </div>
        {rec && (
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2">
            <span className={`w-2 h-2 rounded-full ${rec.isActive ? "bg-green-400" : "bg-gray-500"}`} />
            <span className="text-xs text-gray-300">{rec.isActive ? "Active" : "Paused"}</span>
            <span className="text-xs text-gray-400 ml-2">{rec.totalChats} chats</span>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1 w-fit">
        {(["config", "preview", "embed", "chats"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${activeTab === t ? "bg-brand-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {t}
          </button>
        ))}
      </motion.div>

      {activeTab === "config" && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Receptionist name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Widget colour</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.widgetColor} onChange={(e) => setForm({ ...form, widgetColor: e.target.value })} className="h-10 w-14 rounded-xl cursor-pointer border border-white/8 bg-transparent" />
                <span className="text-xs text-gray-500">{form.widgetColor}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Opening greeting</label>
            <textarea value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} rows={2} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none resize-none focus:border-brand-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Personality / tone (comma-separated traits)</label>
            <input value={form.persona} onChange={(e) => setForm({ ...form, persona: e.target.value })} placeholder="professional, friendly, concise" className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Business hours (optional)</label>
            <input value={form.businessHours ?? ""} onChange={(e) => setForm({ ...form, businessHours: e.target.value })} placeholder="Mon-Fri 9am-6pm GMT" className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
            </label>
            <span className="text-sm text-gray-300">{form.isActive ? "Active — accepting chats" : "Paused"}</span>
          </div>
          <button onClick={save} disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
            {saving ? "Saving..." : rec ? "Save changes" : "Create receptionist"}
          </button>
        </motion.div>
      )}

      {activeTab === "preview" && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-5">
          {!rec ? (
            <p className="text-sm text-gray-500">Save your configuration first to preview the chat.</p>
          ) : (
            <div className="max-w-sm mx-auto">
              <div className="rounded-2xl overflow-hidden border border-white/8 bg-[#0e0e1a]">
                <div style={{ background: form.widgetColor }} className="px-4 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/60" />
                  <p className="text-sm font-semibold text-white">{form.name}</p>
                </div>
                <div className="p-3 space-y-2 h-64 overflow-y-auto">
                  {previewMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${m.role === "user" ? "bg-brand-500 text-white" : "bg-white/8 text-gray-200"}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {previewing && <div className="flex justify-start"><div className="rounded-xl bg-white/8 px-3 py-2 text-xs text-gray-400">Typing...</div></div>}
                </div>
                <form onSubmit={sendPreview} className="p-3 border-t border-white/8 flex gap-2">
                  <input value={previewInput} onChange={(e) => setPreviewInput(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-lg border border-white/8 bg-white/4 px-2 py-1.5 text-xs text-white outline-none" />
                  <button type="submit" style={{ background: form.widgetColor }} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white">Send</button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "embed" && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
          <p className="text-sm text-gray-400">Add this snippet to your website's <code className="text-brand-400 text-xs">&lt;body&gt;</code> tag:</p>
          <pre className="rounded-xl border border-white/8 bg-black/40 p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
          <button onClick={() => navigator.clipboard.writeText(embedCode)} className="rounded-xl border border-white/8 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white">Copy code</button>
        </motion.div>
      )}

      {activeTab === "chats" && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-5">
          {recentChats.length === 0 ? (
            <p className="text-sm text-gray-400">No chats yet. Embed the widget on your website to start capturing visitors.</p>
          ) : (
            <div className="space-y-2">
              {recentChats.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{c.visitorName ?? "Anonymous visitor"}</p>
                    <p className="text-xs text-gray-400">{c.visitorEmail ?? "No email"}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
