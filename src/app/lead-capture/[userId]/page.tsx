"use client";

import { useState } from "react";
import { use } from "react";

export default function LeadCapturePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...form }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/20 mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Get in touch</h1>
          <p className="mt-2 text-sm text-gray-400">Fill in your details and we'll get back to you shortly.</p>
        </div>

        {status === "done" ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
            <div className="text-3xl mb-3">✓</div>
            <h2 className="text-lg font-bold text-white">Thanks! We'll be in touch.</h2>
            <p className="mt-2 text-sm text-gray-400">Your details have been received.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Full name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-gray-600"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-gray-600"
                placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-gray-600"
                placeholder="+44 7700 900000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Company</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-gray-600"
                placeholder="Acme Ltd" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Message</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
                className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none resize-none focus:border-brand-500/50 placeholder:text-gray-600"
                placeholder="How can we help?" />
            </div>
            {status === "error" && <p className="text-xs text-red-400">Something went wrong. Please try again.</p>}
            <button type="submit" disabled={status === "sending"}
              className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
              {status === "sending" ? "Sending..." : "Send enquiry"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-600">
          Powered by <span className="text-brand-400">MansaMusaAI</span>
        </p>
      </div>
    </div>
  );
}
