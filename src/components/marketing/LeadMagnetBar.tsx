"use client";

import { useState } from "react";

export default function LeadMagnetBar() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "lead-magnet-bar" }),
      });
    } catch {}
    setSubmitted(true);
  }

  return (
    <section className="bg-gray-900 border-t border-white/5 px-6 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Free Resource</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Get the free <span className="text-brand-400">AI Business Playbook</span>
        </h2>
        <p className="text-gray-400 mb-6 text-sm">
          The exact 7-step system 1,000+ businesses use to replace £80K of staff costs with AI agents. PDF + video walkthrough. Free forever.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-4">
            <p className="text-green-400 font-semibold">✅ Check your inbox! Your playbook is on its way.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors whitespace-nowrap"
            >
              Send it free →
            </button>
          </form>
        )}
        <p className="mt-3 text-xs text-gray-600">Join 1,000+ business owners. No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
