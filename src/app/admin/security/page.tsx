import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Security Dashboard | Admin" };
export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const since = new Date(Date.now() - 7 * 86400000);

  const [
    recentEvents,
    suspiciousLogins,
    lockedAccounts,
    failedLogins,
    passwordChanges,
    accountLockouts,
  ] = await Promise.all([
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { name: true, email: true } } } }),
    db.auditLog.count({ where: { event: "SUSPICIOUS_LOGIN", createdAt: { gte: since } } }),
    db.user.count({ where: { lockedUntil: { gt: new Date() } } }),
    db.auditLog.count({ where: { event: "LOGIN_FAILURE", createdAt: { gte: since } } }),
    db.auditLog.count({ where: { event: "PASSWORD_CHANGED", createdAt: { gte: since } } }),
    db.auditLog.count({ where: { event: "ACCOUNT_LOCKED", createdAt: { gte: since } } }),
  ]);

  const stats = [
    { label: "Suspicious logins (7d)", value: suspiciousLogins, color: suspiciousLogins > 0 ? "text-amber-400" : "text-green-400" },
    { label: "Currently locked accounts", value: lockedAccounts, color: lockedAccounts > 0 ? "text-red-400" : "text-green-400" },
    { label: "Failed logins (7d)", value: failedLogins, color: "text-gray-300" },
    { label: "Password changes (7d)", value: passwordChanges, color: "text-gray-300" },
    { label: "Account lockouts (7d)", value: accountLockouts, color: accountLockouts > 0 ? "text-amber-400" : "text-green-400" },
  ];

  const EVENT_ICONS: Record<string, string> = {
    LOGIN_SUCCESS: "✅", LOGIN_FAILURE: "❌", LOGOUT: "👋", ACCOUNT_LOCKED: "🔒",
    SUSPICIOUS_LOGIN: "⚠️", PASSWORD_RESET_REQUESTED: "🔑", PASSWORD_RESET_COMPLETED: "✓",
    PASSWORD_CHANGED: "🔐", EMAIL_VERIFICATION_SENT: "📧", EMAIL_VERIFIED: "✅",
    EMAIL_CHANGED: "📬", SESSION_REVOKED: "🚫",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">· Admin ·</p>
        <h1 className="text-2xl font-extrabold text-white">Security Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time threat monitoring and audit trail.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-bold text-white mb-3">Recent audit events</h2>
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/6">
                <th className="py-3 pl-4 text-left text-gray-500 font-semibold">Event</th>
                <th className="py-3 px-3 text-left text-gray-500 font-semibold hidden sm:table-cell">User</th>
                <th className="py-3 px-3 text-left text-gray-500 font-semibold hidden md:table-cell">IP</th>
                <th className="py-3 pr-4 text-right text-gray-500 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e) => (
                <tr key={e.id} className="border-b border-white/4 hover:bg-white/2">
                  <td className="py-2.5 pl-4">
                    <span>{EVENT_ICONS[e.event] ?? "•"}</span>
                    <span className={`ml-2 font-mono ${e.event.includes("FAIL") || e.event.includes("LOCK") || e.event.includes("SUSPICIOUS") ? "text-amber-400" : "text-gray-400"}`}>
                      {e.event}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 hidden sm:table-cell">{e.user?.email ?? "—"}</td>
                  <td className="py-2.5 px-3 text-gray-600 font-mono hidden md:table-cell">{e.ip ?? "—"}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-600">{new Date(e.createdAt).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
