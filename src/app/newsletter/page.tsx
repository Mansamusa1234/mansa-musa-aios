"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setMessage(data.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-2xl font-bold text-brand-600">
          MansaMusaAI
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">Stay in the loop</h1>
        <p className="mt-1 text-sm text-gray-500">Product updates, fintech AI insights, no spam.</p>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          {message ? (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {loading ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
