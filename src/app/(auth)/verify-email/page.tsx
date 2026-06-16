"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-2xl font-bold text-brand-600">
          MansaMusaAI
        </Link>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          {status === "verifying" && <p className="text-sm text-gray-500">Verifying your email…</p>}
          {status === "success" && (
            <>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
              <p className="text-sm font-medium text-gray-900">Email verified!</p>
              <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
                Go to dashboard
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
              <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
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
