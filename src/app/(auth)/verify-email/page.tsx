"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setError("Missing verification link.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(data.error ?? "Verification failed.");
          return;
        }
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
        setError("Something went wrong.");
      });
  }, [searchParams]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#070712] px-4 transition-colors">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Back to home"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Home
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>

      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-2xl font-bold text-brand-600 dark:text-brand-400" aria-label="MansaMusaAI home">
          MansaMusaAI
        </Link>

        <div className="mt-8 rounded-2xl bg-white dark:bg-[#09091a] p-8 shadow-card dark:shadow-none border border-gray-100 dark:border-white/8">
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-3">
              <svg className="h-6 w-6 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">Verifying your email…</p>
            </div>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Email verified!</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your account is now active.</p>
              <Link
                href="/dashboard"
                className="mt-5 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                Go to dashboard
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Verification failed</h1>
              <div className="mt-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
              <Link
                href="/dashboard"
                className="mt-4 inline-block text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                Go to dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
