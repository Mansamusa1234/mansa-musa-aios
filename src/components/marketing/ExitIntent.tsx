"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("exit-dismissed")) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !dismissed) setShow(true);
    };

    // Mobile: show after 45 seconds of inactivity
    const timer = setTimeout(() => {
      if (!dismissed && !sessionStorage.getItem("exit-dismissed")) setShow(true);
    }, 45000);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(timer);
    };
  }, [dismissed]);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("exit-dismissed", "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "exit-intent" }),
      });
    } catch {}
    setSubmitted(true);
    setTimeout(dismiss, 2500);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={dismiss}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute right-4 top-4 text-gray-600 hover:text-gray-300 text-xl">✕</button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">You&apos;re in!</h3>
            <p className="text-gray-400 text-sm">Check your inbox for your free AI Business Audit.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl">🎁</span>
              <h3 className="mt-3 text-2xl font-extrabold text-white">
                Before you go — get your free<br />AI Business Audit
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                We&apos;ll analyse your business and show you exactly where AI agents can save you time and money. <span className="text-brand-400 font-semibold">Worth £297. Yours free.</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
              >
                Send my free audit →
              </button>
            </form>

            <p className="mt-3 text-center text-xs text-gray-600">No spam. Unsubscribe anytime.</p>

            <button onClick={dismiss} className="mt-4 w-full text-center text-xs text-gray-700 hover:text-gray-500">
              No thanks, I don&apos;t want free money
            </button>
          </>
        )}
      </div>
    </div>
  );
}
