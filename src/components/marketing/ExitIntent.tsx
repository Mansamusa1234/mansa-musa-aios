"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("mm_exit_seen")) return;

    let triggered = false;

    function onMouseLeave(e: MouseEvent) {
      if (triggered || e.clientY > 50) return;
      triggered = true;
      sessionStorage.setItem("mm_exit_seen", "1");
      setShow(true);
    }

    const mobileTimer = setTimeout(() => {
      if (!triggered && !sessionStorage.getItem("mm_exit_seen")) {
        triggered = true;
        sessionStorage.setItem("mm_exit_seen", "1");
        setShow(true);
      }
    }, 45000);

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(mobileTimer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "exit-intent" }),
    }).catch(() => {});
    setSubmitted(true);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-[#0d0d16] border border-white/10 p-8 text-center shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand-500/10 to-transparent" />

            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              <div className="py-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-3xl">
                  ✅
                </div>
                <h3 className="text-xl font-bold text-white">You&apos;re in!</h3>
                <p className="mt-2 text-sm text-gray-400">Check your inbox for your free AI Business Audit.</p>
                <Link
                  href="/register"
                  onClick={() => setShow(false)}
                  className="mt-5 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                >
                  Start free trial →
                </Link>
              </div>
            ) : (
              <>
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/15 text-3xl">
                  🎁
                </div>
                <h3 className="relative text-2xl font-bold text-white">Before you go — get your free AI Business Audit</h3>
                <p className="relative mt-2 text-gray-400 text-sm leading-relaxed">
                  We&apos;ll analyse your business and show you exactly where AI can save you time and money.{" "}
                  <span className="text-brand-400 font-semibold">Worth £297. Yours free.</span>
                </p>

                <form onSubmit={handleSubmit} className="relative mt-5 space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
                  >
                    Send my free audit →
                  </button>
                </form>

                <button
                  onClick={() => setShow(false)}
                  className="relative mt-3 text-xs text-gray-700 hover:text-gray-500 transition-colors"
                >
                  No thanks, I don&apos;t want free money
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
