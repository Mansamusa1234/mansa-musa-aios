"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  const isNetwork =
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network");

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto max-w-sm"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="mb-2 text-lg font-semibold text-white">Something went wrong</h1>
        <p className="mb-6 text-sm text-gray-400 leading-relaxed">
          {isNetwork
            ? "We couldn't reach our servers. Check your connection and try again."
            : "An unexpected error occurred. Our team has been notified."}
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-[11px] text-gray-600">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-xl border border-white/8 px-5 py-2.5 text-sm font-medium text-gray-300 hover:border-white/15 hover:text-white transition-colors"
          >
            Go to dashboard
          </a>
        </div>
      </motion.div>
    </div>
  );
}
