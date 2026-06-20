"use client";

import { useEffect } from "react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-6xl mb-4">⚠️</p>
          <h1 className="text-2xl font-extrabold text-white">Something went wrong</h1>
          <p className="mt-3 text-sm text-gray-400">
            An unexpected error occurred. Please try again or return to the dashboard.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-gray-600 font-mono">Ref: {error.digest}</p>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-colors"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
