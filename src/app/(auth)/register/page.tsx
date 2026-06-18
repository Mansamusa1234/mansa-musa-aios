"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get("ref"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ref ? { name, email, password, ref } : { name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
  }

  const inputBase =
    "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 " +
    "px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "outline-none transition-colors " +
    "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 " +
    "disabled:opacity-50";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#070712] px-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-brand-600 dark:text-brand-400" aria-label="MansaMusaAI home">
            MansaMusaAI
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Free forever. No credit card required.
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#09091a] p-8 shadow-card dark:shadow-none border border-gray-100 dark:border-white/8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBase}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBase}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="new-password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={[inputBase, "pr-11"].join(" ")}
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
