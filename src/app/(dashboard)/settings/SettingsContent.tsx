"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/motion";
import PasswordStrengthMeter from "@/components/ui/PasswordStrengthMeter";

interface SessionRow {
  id: string;
  ip: string | null;
  userAgent: string | null;
  rememberMe: boolean;
  createdAt: Date;
  lastSeenAt: Date;
  isCurrent: boolean;
}

interface Props {
  name: string;
  email: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  sessions: SessionRow[];
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <h2 className="text-sm font-bold text-white mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}

function Banner({ message, isError }: { message: string; isError: boolean }) {
  return (
    <p className={`mt-3 text-xs font-medium ${isError ? "text-red-400" : "text-green-400"}`}>{message}</p>
  );
}

function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  if (/iPhone|iPad/.test(userAgent)) return "iOS device";
  if (/Android/.test(userAgent)) return "Android device";
  if (/Mac OS X/.test(userAgent)) return "Mac";
  if (/Windows/.test(userAgent)) return "Windows PC";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Unknown device";
}

export default function SettingsContent({ name: initialName, email, emailVerified, twoFactorEnabled: initial2FA, sessions: initialSessions }: Props) {
  const [name, setName] = useState(initialName);
  const [nameStatus, setNameStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const [twoFAEnabled, setTwoFAEnabled] = useState(initial2FA);
  const [twoFAStep, setTwoFAStep] = useState<"idle" | "setup" | "backup">("idle");
  const [twoFAQR, setTwoFAQR] = useState<string>("");
  const [twoFASecret, setTwoFASecret] = useState<string>("");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
  const [twoFADisableToken, setTwoFADisableToken] = useState("");
  const [twoFADisablePassword, setTwoFADisablePassword] = useState("");
  const [twoFAStatus, setTwoFAStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [sessions, setSessions] = useState(initialSessions);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameStatus(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setNameStatus(res.ok ? { message: "Profile updated.", isError: false } : { message: data.error, isError: true });
    } catch {
      setNameStatus({ message: "Something went wrong. Please try again.", isError: true });
    } finally {
      setNameSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordStatus(null);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ message: "Password changed.", isError: false });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordStatus({ message: data.error, isError: true });
      }
    } catch {
      setPasswordStatus({ message: "Something went wrong. Please try again.", isError: true });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, currentPassword: emailPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus({ message: data.message, isError: false });
        setNewEmail("");
        setEmailPassword("");
      } else {
        setEmailStatus({ message: data.error, isError: true });
      }
    } catch {
      setEmailStatus({ message: "Something went wrong. Please try again.", isError: true });
    } finally {
      setEmailSaving(false);
    }
  }

  async function revokeSession(id: string) {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/account/sessions/${id}`, { method: "DELETE" });
      if (res.ok) setSessions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setRevokingId(null);
    }
  }

  async function start2FASetup() {
    setTwoFALoading(true);
    setTwoFAStatus(null);
    try {
      const res = await fetch("/api/account/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setTwoFAQR(data.qrDataUrl); setTwoFASecret(data.secret); setTwoFAStep("setup"); }
      else setTwoFAStatus({ message: data.error, isError: true });
    } finally { setTwoFALoading(false); }
  }

  async function verify2FA(e: React.FormEvent) {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAStatus(null);
    try {
      const res = await fetch("/api/account/2fa/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: twoFAToken }) });
      const data = await res.json();
      if (res.ok) { setTwoFABackupCodes(data.backupCodes); setTwoFAStep("backup"); setTwoFAEnabled(true); }
      else setTwoFAStatus({ message: data.error, isError: true });
    } finally { setTwoFALoading(false); }
  }

  async function disable2FA(e: React.FormEvent) {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAStatus(null);
    try {
      const res = await fetch("/api/account/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: twoFADisableToken, password: twoFADisablePassword }) });
      const data = await res.json();
      if (res.ok) { setTwoFAEnabled(false); setTwoFADisableToken(""); setTwoFADisablePassword(""); setTwoFAStatus({ message: "Two-factor authentication disabled.", isError: false }); }
      else setTwoFAStatus({ message: data.error, isError: true });
    } finally { setTwoFALoading(false); }
  }

  async function revokeAllOthers() {
    setRevokingAll(true);
    try {
      const res = await fetch("/api/account/sessions/revoke-others", { method: "DELETE" });
      if (res.ok) setSessions((prev) => prev.filter((s) => s.isCurrent));
    } finally {
      setRevokingAll(false);
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-2xl">
      <motion.div variants={fadeUp}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Settings ·</p>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Account settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile, password, email, and active sessions.</p>
      </motion.div>

      <Card title="Profile">
        <form onSubmit={saveName} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={nameSaving}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {nameSaving ? "Saving..." : "Save"}
          </button>
          {nameStatus && <Banner {...nameStatus} />}
        </form>
      </Card>

      <Card title="Change password">
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50"
              minLength={8}
              required
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {passwordSaving ? "Saving..." : "Change password"}
          </button>
          {passwordStatus && <Banner {...passwordStatus} />}
        </form>
      </Card>

      <Card title="Email address">
        <p className="text-xs text-gray-500 mb-3">
          Current: <span className="text-gray-300">{email}</span>{" "}
          {emailVerified ? (
            <span className="text-green-400">(verified)</span>
          ) : (
            <span className="text-amber-400">(unverified)</span>
          )}
        </p>
        <form onSubmit={changeEmail} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">New email address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Current password</label>
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50"
              required
            />
          </div>
          <button
            type="submit"
            disabled={emailSaving}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {emailSaving ? "Sending..." : "Send verification link"}
          </button>
          {emailStatus && <Banner {...emailStatus} />}
        </form>
      </Card>

      <Card title="Two-factor authentication">
        {twoFAStep === "backup" ? (
          <div>
            <p className="text-xs text-green-400 font-semibold mb-3">2FA enabled successfully. Save these backup codes — each can only be used once:</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {twoFABackupCodes.map((c) => <code key={c} className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-xs font-mono text-gray-300 text-center">{c}</code>)}
            </div>
            <button onClick={() => setTwoFAStep("idle")} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">Done</button>
          </div>
        ) : twoFAStep === "setup" ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm.</p>
            {twoFAQR && <img src={twoFAQR} alt="2FA QR code" className="mx-auto w-44 h-44 rounded-xl border border-white/8 bg-white p-2" />}
            <p className="text-[11px] text-gray-600">Or enter manually: <code className="text-gray-400 text-[11px]">{twoFASecret}</code></p>
            <form onSubmit={verify2FA} className="flex gap-2">
              <input value={twoFAToken} onChange={(e) => setTwoFAToken(e.target.value)} placeholder="6-digit code" maxLength={6} className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" required />
              <button type="submit" disabled={twoFALoading} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">Verify</button>
            </form>
            {twoFAStatus && <Banner {...twoFAStatus} />}
          </div>
        ) : twoFAEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-green-400" /><p className="text-sm text-green-400 font-semibold">Two-factor authentication is enabled</p></div>
            <p className="text-xs text-gray-500">To disable 2FA, enter your current password and authenticator code.</p>
            <form onSubmit={disable2FA} className="space-y-3">
              <input type="password" value={twoFADisablePassword} onChange={(e) => setTwoFADisablePassword(e.target.value)} placeholder="Current password" className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none" required />
              <input value={twoFADisableToken} onChange={(e) => setTwoFADisableToken(e.target.value)} placeholder="Authenticator code" maxLength={6} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none" required />
              <button type="submit" disabled={twoFALoading} className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50">Disable 2FA</button>
            </form>
            {twoFAStatus && <Banner {...twoFAStatus} />}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-gray-600" /><p className="text-sm text-gray-400">Two-factor authentication is not enabled</p></div>
            <p className="text-xs text-gray-500">Add an extra layer of security. You'll need an authenticator app on your phone.</p>
            <button onClick={start2FASetup} disabled={twoFALoading} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
              {twoFALoading ? "Loading..." : "Enable 2FA"}
            </button>
            {twoFAStatus && <Banner {...twoFAStatus} />}
          </div>
        )}
      </Card>

      <Card title="Active sessions">
        {sessions.filter((s) => !s.isCurrent).length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={revokeAllOthers}
              disabled={revokingAll}
              className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {revokingAll ? "Signing out..." : "Sign out all other devices"}
            </button>
          </div>
        )}
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-600">No active sessions.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {deviceLabel(s.userAgent)}
                    {s.isCurrent && <span className="ml-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold text-brand-300">This device</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {s.ip ?? "Unknown IP"} · Last active {new Date(s.lastSeenAt).toLocaleString()}
                  </p>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => revokeSession(s.id)}
                    disabled={revokingId === s.id}
                    className="flex-shrink-0 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {revokingId === s.id ? "..." : "Sign out"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
