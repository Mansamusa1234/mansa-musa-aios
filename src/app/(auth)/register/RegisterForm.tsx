"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Props {
  showGithub: boolean;
  showGoogle: boolean;
  showMicrosoft?: boolean;
  showApple?: boolean;
}

function validateName(v: string) {
  if (!v.trim()) return "Full legal name is required.";
  if (v.trim().length < 2) return "Name must be at least 2 characters.";
  return "";
}
function validateEmail(v: string) {
  if (!v) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  return "";
}
function validatePassword(v: string) {
  if (!v) return "Password is required.";
  if (v.length < 8) return "Password must be at least 8 characters.";
  return "";
}

const inputBase =
  "w-full rounded-xl border bg-white dark:bg-white/5 " +
  "px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "outline-none transition-colors focus:ring-2 disabled:opacity-50";

function fieldCls(error: string, touched: boolean) {
  if (!touched) return `${inputBase} border-gray-200 dark:border-white/10 focus:border-brand-500 focus:ring-brand-500/20`;
  if (error) return `${inputBase} border-red-400 dark:border-red-500/50 focus:border-red-400 focus:ring-red-400/20`;
  return `${inputBase} border-green-400 dark:border-green-500/50 focus:border-green-400 focus:ring-green-400/20`;
}

function FieldCheck() {
  return (
    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function PasswordReqs({ password }: { password: string }) {
  if (!password) return null;
  const reqs = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least 1 number or symbol", met: /[0-9!@#$%^&*()_+\-=\[\]{}|;':",.<>?/`~\\]/.test(password) },
  ];
  return (
    <ul id="register-pw-reqs" className="mt-2 space-y-1" aria-label="Password requirements">
      {reqs.map((r) => (
        <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.met ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            {r.met
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />}
          </svg>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

function TrustBar() {
  const items = [
    { label: "256-bit SSL", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { label: "GDPR compliant", path: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "No credit card", path: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
    { label: "100k+ businesses", path: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
  ];
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-gray-400 dark:text-gray-500">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
          </svg>
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function RegisterForm({ showGithub, showGoogle, showMicrosoft, showApple }: Props) {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOAuth, setLoadingOAuth] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", password: "" });

  const hasOAuth = showGithub || showGoogle || showMicrosoft || showApple;

  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get("ref"));
    nameRef.current?.focus();
  }, []);

  function touchField(field: "name" | "email" | "password") {
    setTouched((t) => ({ ...t, [field]: true }));
    setFieldErrors({
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    });
  }

  function onChangeName(v: string) {
    setName(v);
    if (touched.name) setFieldErrors((f) => ({ ...f, name: validateName(v) }));
  }
  function onChangeEmail(v: string) {
    setEmail(v);
    if (touched.email) setFieldErrors((f) => ({ ...f, email: validateEmail(v) }));
  }
  function onChangePassword(v: string) {
    setPassword(v);
    if (touched.password) setFieldErrors((f) => ({ ...f, password: validatePassword(v) }));
  }

  async function handleOAuth(provider: string) {
    setLoadingOAuth(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    const errs = { name: validateName(name), email: validateEmail(email), password: validatePassword(password) };
    setFieldErrors(errs);
    if (errs.name || errs.email || errs.password) return;

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

  function oauthCls(provider: string) {
    const base = "flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-white/8 py-2.5 text-sm font-medium transition-all";
    if (loadingOAuth === provider) return `${base} bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 cursor-wait`;
    if (loadingOAuth) return `${base} text-gray-300 dark:text-gray-600 opacity-50 cursor-not-allowed`;
    return `${base} text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98]`;
  }

  function OAuthSpinner() {
    return (
      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }

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

      <div className="w-full max-w-md py-16 sm:py-8">
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

          {/* Sign-in link — top of card, visible before user fills anything */}
          <p className="mb-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Sign in
            </Link>
          </p>

          {/* OAuth providers */}
          {hasOAuth && (
            <>
              <div className="space-y-3">
                {showGoogle && (
                  <button
                    onClick={() => handleOAuth("google")}
                    disabled={!!loadingOAuth}
                    aria-label="Sign up with Google"
                    className={oauthCls("google")}
                  >
                    {loadingOAuth === "google" ? <OAuthSpinner /> : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    {loadingOAuth === "google" ? "Redirecting to Google…" : "Sign up with Google"}
                  </button>
                )}
                {showApple && (
                  <button onClick={() => handleOAuth("apple")} disabled={!!loadingOAuth} aria-label="Sign up with Apple" className={oauthCls("apple")}>
                    {loadingOAuth === "apple" ? <OAuthSpinner /> : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.633 0 2.937.06 4.486 2.3-.115.08-2.43 1.46-2.43 4.21 0 3.21 2.797 4.31 2.89 4.34z" />
                      </svg>
                    )}
                    {loadingOAuth === "apple" ? "Redirecting to Apple…" : "Sign up with Apple"}
                  </button>
                )}
                {showMicrosoft && (
                  <button onClick={() => handleOAuth("microsoft-entra-id")} disabled={!!loadingOAuth} aria-label="Sign up with Microsoft" className={oauthCls("microsoft-entra-id")}>
                    {loadingOAuth === "microsoft-entra-id" ? <OAuthSpinner /> : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#F25022" d="M1 1h10v10H1z" />
                        <path fill="#7FBA00" d="M13 1h10v10H13z" />
                        <path fill="#00A4EF" d="M1 13h10v10H1z" />
                        <path fill="#FFB900" d="M13 13h10v10H13z" />
                      </svg>
                    )}
                    {loadingOAuth === "microsoft-entra-id" ? "Redirecting to Microsoft…" : "Sign up with Microsoft"}
                  </button>
                )}
                {showGithub && (
                  <button onClick={() => handleOAuth("github")} disabled={!!loadingOAuth} aria-label="Sign up with GitHub" className={oauthCls("github")}>
                    {loadingOAuth === "github" ? <OAuthSpinner /> : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    )}
                    {loadingOAuth === "github" ? "Redirecting to GitHub…" : "Sign up with GitHub"}
                  </button>
                )}
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
                <span className="text-xs text-gray-400 dark:text-gray-500">or continue with email</span>
                <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
              </div>
            </>
          )}

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div role="alert" id="register-form-error" className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Full legal name */}
            <div>
              <label htmlFor="register-name" className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>Full legal name</span>
                {touched.name && !fieldErrors.name && <FieldCheck />}
              </label>
              <input
                ref={nameRef}
                id="register-name"
                type="text"
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => onChangeName(e.target.value)}
                onBlur={() => touchField("name")}
                aria-invalid={touched.name && !!fieldErrors.name ? true : undefined}
                aria-describedby={touched.name && fieldErrors.name ? "register-name-error" : undefined}
                className={fieldCls(fieldErrors.name, touched.name)}
                placeholder="As it appears on your ID"
              />
              {touched.name && fieldErrors.name && (
                <p id="register-name-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email address */}
            <div>
              <label htmlFor="register-email" className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>Email address</span>
                {touched.email && !fieldErrors.email && <FieldCheck />}
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => onChangeEmail(e.target.value)}
                onBlur={() => touchField("email")}
                aria-invalid={touched.email && !!fieldErrors.email ? true : undefined}
                aria-describedby={touched.email && fieldErrors.email ? "register-email-error" : undefined}
                className={fieldCls(fieldErrors.email, touched.email)}
                placeholder="you@example.com"
              />
              {touched.email && fieldErrors.email && (
                <p id="register-email-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>Password</span>
                {touched.password && !fieldErrors.password && <FieldCheck />}
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
                  onChange={(e) => onChangePassword(e.target.value)}
                  onBlur={() => touchField("password")}
                  aria-invalid={touched.password && !!fieldErrors.password ? true : undefined}
                  aria-describedby="register-pw-reqs"
                  className={`${fieldCls(fieldErrors.password, touched.password)} pr-11`}
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
              <PasswordReqs password={password} />
              {touched.password && fieldErrors.password && (
                <p id="register-password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</Link>.
            </p>

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
                "Create free account"
              )}
            </button>
          </form>
        </div>

        <TrustBar />
      </div>
    </div>
  );
}
