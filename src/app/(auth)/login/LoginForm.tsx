"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface Props {
  showGithub: boolean;
  showGoogle: boolean;
  showMicrosoft?: boolean;
  showApple?: boolean;
}

const inputBase =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 " +
  "px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "outline-none transition-colors " +
  "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 " +
  "disabled:opacity-50";

function OAuthSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LoginForm({ showGithub, showGoogle, showMicrosoft, showApple }: Props) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const totpRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"credentials" | "totp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [totp, setTotp] = useState("");
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOAuth, setLoadingOAuth] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [loadingPasskey, setLoadingPasskey] = useState(false);

  const hasOAuth = showGithub || showGoogle || showMicrosoft || showApple;

  useEffect(() => {
    if (phase === "credentials") emailRef.current?.focus();
    if (phase === "totp") totpRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setPasskeySupported)
        .catch(() => {});
    }
  }, []);

  async function handlePasskey() {
    setLoadingPasskey(true);
    setError("");
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      await navigator.credentials.get({
        publicKey: { challenge, userVerification: "required", rpId: window.location.hostname },
      });
      router.push("/dashboard");
    } catch {
      setError("Passkey sign-in failed. Please use your email and password.");
    } finally {
      setLoadingPasskey(false);
    }
  }

  async function handleOAuth(provider: string) {
    setLoadingOAuth(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/2fa/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setFailedAttempts((n) => n + 1);
      setError(data.error ?? "Invalid email or password.");
      return;
    }

    if (data.requires2FA) {
      setLoading(false);
      setChallengeToken(data.challengeToken);
      setPhase("totp");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setFailedAttempts((n) => n + 1);
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    const code = totp.replace(/[\s-]/g, "");
    if (!isBackupMode && code.length < 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      challengeToken,
      totp: code,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(isBackupMode ? "Invalid backup code. Check it and try again." : "Invalid code. Check your authenticator app and try again.");
      setTotp("");
    } else {
      router.push("/dashboard");
    }
  }

  function oauthCls(provider: string) {
    const base = "flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-white/8 py-2.5 text-sm font-medium transition-all";
    if (loadingOAuth === provider) return `${base} bg-gray-50 dark:bg-white/5 text-gray-500 cursor-wait`;
    if (loadingOAuth) return `${base} text-gray-300 dark:text-gray-600 opacity-50 cursor-not-allowed`;
    return `${base} text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98]`;
  }

  // ── 2FA / TOTP phase ─────────────────────────────────────────────────────────
  if (phase === "totp") {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#070712] px-4 transition-colors">
        {/* Home navigation — same pattern as all other auth pages */}
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

        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold text-brand-600 dark:text-brand-400" aria-label="MansaMusaAI home">
              MansaMusaAI
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Two-step verification
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isBackupMode ? "Enter one of your saved backup codes" : "Enter the 6-digit code from your authenticator app"}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#09091a] p-8 shadow-card dark:shadow-none border border-gray-100 dark:border-white/8">
            {!isBackupMode && (
              <div className="mb-6 flex justify-center gap-6 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                    <rect width="24" height="24" rx="4" fill="#4285F4" />
                    <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" fill="white" />
                    <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="#4285F4" />
                  </svg>
                  Google Authenticator
                </span>
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                    <rect width="24" height="24" rx="4" fill="#00A4EF" />
                    <text x="4" y="16" fontSize="10" fill="white" fontWeight="bold">MS</text>
                  </svg>
                  Microsoft Auth
                </span>
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
                    <rect width="24" height="24" rx="4" fill="#EC1C24" />
                    <text x="3" y="16" fontSize="9" fill="white" fontWeight="bold">Authy</text>
                  </svg>
                  Authy
                </span>
              </div>
            )}

            <form onSubmit={handleTotp} className="space-y-4" noValidate>
              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                  <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="totp-code" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isBackupMode ? "Backup code" : "Authenticator code"}
                </label>
                <input
                  ref={totpRef}
                  id="totp-code"
                  type="text"
                  inputMode={isBackupMode ? "text" : "numeric"}
                  pattern={isBackupMode ? undefined : "[\\d\\s]{6,7}"}
                  maxLength={isBackupMode ? 24 : 7}
                  required
                  value={totp}
                  onChange={(e) => {
                    if (isBackupMode) {
                      setTotp(e.target.value);
                    } else {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setTotp(v.slice(0, 6));
                    }
                  }}
                  className={[inputBase, isBackupMode ? "" : "text-center text-2xl font-mono tracking-[0.5em]"].join(" ")}
                  placeholder={isBackupMode ? "xxxx-xxxx-xxxx" : "000000"}
                  autoComplete="one-time-code"
                  aria-label={isBackupMode ? "Backup recovery code" : "6-digit authenticator code"}
                />
              </div>

              <button
                type="submit"
                disabled={loading || (!isBackupMode && totp.length < 6)}
                className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <OAuthSpinner />
                    Verifying…
                  </span>
                ) : (
                  "Verify and sign in"
                )}
              </button>
            </form>

            {/* Backup code toggle — prominent CTA, not a footnote */}
            <div className="mt-4 border-t border-gray-100 dark:border-white/8 pt-4 text-center">
              <button
                onClick={() => { setIsBackupMode((v) => !v); setTotp(""); setError(""); }}
                className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                {isBackupMode ? "Use authenticator app instead" : "Use a backup code instead"}
              </button>
            </div>

            <button
              onClick={() => { setPhase("credentials"); setTotp(""); setError(""); setChallengeToken(""); setIsBackupMode(false); }}
              className="mt-3 w-full text-center text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Credentials phase ─────────────────────────────────────────────────────────
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

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-brand-600 dark:text-brand-400" aria-label="MansaMusaAI home">
            MansaMusaAI
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#09091a] p-8 shadow-card dark:shadow-none border border-gray-100 dark:border-white/8">
          {passkeySupported && (
            <>
              <button
                type="button"
                onClick={handlePasskey}
                disabled={loadingPasskey}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-white/8 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98] disabled:opacity-50 transition-all mb-3"
              >
                {loadingPasskey ? (
                  <OAuthSpinner />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                )}
                {loadingPasskey ? "Authenticating…" : "Sign in with Passkey / Face ID / Touch ID"}
              </button>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
                <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
              </div>
            </>
          )}

          {hasOAuth && (
            <>
              <div className="space-y-3">
                {showGithub && (
                  <button
                    onClick={() => handleOAuth("github")}
                    disabled={!!loadingOAuth}
                    aria-label="Continue with GitHub"
                    className={oauthCls("github")}
                  >
                    {loadingOAuth === "github" ? <OAuthSpinner /> : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    )}
                    {loadingOAuth === "github" ? "Redirecting to GitHub…" : "Continue with GitHub"}
                  </button>
                )}
                {showGoogle && (
                  <button
                    onClick={() => handleOAuth("google")}
                    disabled={!!loadingOAuth}
                    aria-label="Continue with Google"
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
                    {loadingOAuth === "google" ? "Redirecting to Google…" : "Continue with Google"}
                  </button>
                )}
                {showMicrosoft && (
                  <button
                    onClick={() => handleOAuth("microsoft-entra-id")}
                    disabled={!!loadingOAuth}
                    aria-label="Continue with Microsoft"
                    className={oauthCls("microsoft-entra-id")}
                  >
                    {loadingOAuth === "microsoft-entra-id" ? <OAuthSpinner /> : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#F25022" d="M1 1h10v10H1z" />
                        <path fill="#7FBA00" d="M13 1h10v10H13z" />
                        <path fill="#00A4EF" d="M1 13h10v10H1z" />
                        <path fill="#FFB900" d="M13 13h10v10H13z" />
                      </svg>
                    )}
                    {loadingOAuth === "microsoft-entra-id" ? "Redirecting to Microsoft…" : "Continue with Microsoft"}
                  </button>
                )}
                {showApple && (
                  <button
                    onClick={() => handleOAuth("apple")}
                    disabled={!!loadingOAuth}
                    aria-label="Continue with Apple"
                    className={oauthCls("apple")}
                  >
                    {loadingOAuth === "apple" ? <OAuthSpinner /> : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.633 0 2.937.06 4.486 2.3-.115.08-2.43 1.46-2.43 4.21 0 3.21 2.797 4.31 2.89 4.34z" />
                      </svg>
                    )}
                    {loadingOAuth === "apple" ? "Redirecting to Apple…" : "Continue with Apple"}
                  </button>
                )}
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
                <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-white/8" />
              </div>
            </>
          )}

          <form onSubmit={handleCredentials} className="space-y-4" noValidate>
            {error && (
              <div role="alert" id="login-error" className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Contextual "forgot password" nudge after first failed attempt */}
            {failedAttempts >= 1 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">Having trouble signing in?</p>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap"
                >
                  Reset password →
                </Link>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={failedAttempts > 0 ? true : undefined}
                aria-describedby={failedAttempts > 0 ? "login-error" : undefined}
                className={inputBase}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={failedAttempts > 0 ? true : undefined}
                  aria-describedby={failedAttempts > 0 ? "login-error" : undefined}
                  className={[inputBase, "pr-11"].join(" ")}
                  placeholder="••••••••"
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
            </div>

            <label className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-white/20 text-brand-500 focus:ring-brand-500/30 bg-white dark:bg-white/5"
              />
              Stay signed in for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <OAuthSpinner />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          New to MansaMusaAI?{" "}
          <Link href="/register" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
