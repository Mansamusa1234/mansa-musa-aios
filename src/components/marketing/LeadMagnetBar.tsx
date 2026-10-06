"use client";

import { useState } from "react";

export default function LeadMagnetBar() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "lead-magnet-bar" }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? "Could not subscribe. Please try again.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error && err.name === "AbortError" ? "Request timed out. Please try again." : err instanceof Error ? err.message : "Connection error. Please try again.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <section className="bg-gray-900 border-t border-white/5 px-6 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">AI Updates</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Get <span className="text-brand-400">AI business updates</span>
        </h2>
        <p className="text-gray-400 mb-6 text-sm">
          Subscribe for news about AI agents and business automation.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-4">
            <p className="text-green-400 font-semibold">✅ You are subscribed to AI business updates.</p>
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
              disabled={loading}
              className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors whitespace-nowrap"
            >
              {loading ? "Subscribing…" : "Subscribe free →"}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <p className="mt-3 text-xs text-gray-600">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
