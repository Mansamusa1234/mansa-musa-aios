import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";

const ADMIN_EMAIL = process.env.REPORT_EMAIL ?? "ai@mansamusainitiative.com";

interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
  critical: boolean;
  autoFixed?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function providerMessage(status: number, provider: string): string {
  if (status === 401 || status === 403) return `${provider} credentials rejected (HTTP ${status}) — re-authorise the integration`;
  if (status === 429) return `${provider} API reachable but rate limited (HTTP 429)`;
  return `${provider} API returned HTTP ${status}`;
}

async function checkDatabase(): Promise<CheckResult> {
  try {
    const t = Date.now();
    await db.$queryRaw`SELECT 1`;
    const ms = Date.now() - t;
    return { name: "Database", ok: true, message: `Responding in ${ms}ms`, critical: true };
  } catch (err) {
    return { name: "Database", ok: false, message: err instanceof Error ? err.message : "Unreachable", critical: true };
  }
}

async function checkAnthropicAPI(): Promise<CheckResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { name: "Anthropic AI", ok: false, message: "ANTHROPIC_API_KEY not set", critical: true };
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    });
    return { name: "Anthropic AI", ok: res.ok, message: res.ok ? "API reachable" : `HTTP ${res.status}`, critical: true };
  } catch {
    return { name: "Anthropic AI", ok: false, message: "Network error", critical: true };
  }
}

async function checkStripe(): Promise<CheckResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { name: "Stripe", ok: false, message: "STRIPE_SECRET_KEY not set", critical: true };
  }
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    return { name: "Stripe", ok: res.ok, message: res.ok ? "Billing operational" : `HTTP ${res.status}`, critical: true };
  } catch {
    return { name: "Stripe", ok: false, message: "Network error", critical: true };
  }
}

async function checkResendEmail(): Promise<CheckResult> {
  if (!process.env.RESEND_API_KEY) {
    return { name: "Email (Resend)", ok: false, message: "RESEND_API_KEY not set", critical: true };
  }
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    return { name: "Email (Resend)", ok: res.ok, message: res.ok ? "Email delivery operational" : `HTTP ${res.status}`, critical: true };
  } catch {
    return { name: "Email (Resend)", ok: false, message: "Network error", critical: true };
  }
}

async function checkInstagram(): Promise<CheckResult> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { name: "Instagram", ok: false, message: "Not configured — set INSTAGRAM_ACCESS_TOKEN", critical: false };
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(token)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({})) as { id?: string; error?: { message?: string; code?: number } };
    if (!res.ok || data.error) {
      const detail = data.error?.message ? `: ${data.error.message}` : "";
      return { name: "Instagram", ok: false, message: `Access token invalid or expired (HTTP ${res.status})${detail}`, critical: false };
    }
    return { name: "Instagram", ok: true, message: "Access token valid", critical: false };
  } catch {
    return { name: "Instagram", ok: false, message: "Network error", critical: false };
  }
}

async function checkPinterest(): Promise<CheckResult> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) return { name: "Pinterest", ok: false, message: "Not configured — set PINTEREST_ACCESS_TOKEN", critical: false };
  try {
    const res = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const reachable = res.ok || res.status === 429;
    return {
      name: "Pinterest",
      ok: reachable,
      message: res.ok ? "Access token valid" : providerMessage(res.status, "Pinterest"),
      critical: false,
    };
  } catch {
    return { name: "Pinterest", ok: false, message: "Network error", critical: false };
  }
}

async function checkLinkedIn(): Promise<CheckResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) return { name: "LinkedIn", ok: false, message: "Not configured — set LINKEDIN_ACCESS_TOKEN", critical: false };
  try {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const reachable = res.ok || res.status === 429;
    return {
      name: "LinkedIn",
      ok: reachable,
      message: res.ok ? "Access token valid" : providerMessage(res.status, "LinkedIn"),
      critical: false,
    };
  } catch {
    return { name: "LinkedIn", ok: false, message: "Network error", critical: false };
  }
}

async function checkTwitter(): Promise<CheckResult> {
  const token = process.env.TWITTER_ACCESS_TOKEN;
  const tokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  const key = process.env.TWITTER_API_KEY;
  const secret = process.env.TWITTER_API_SECRET;
  if (!token || !tokenSecret || !key || !secret) {
    return { name: "Twitter/X", ok: false, message: "OAuth 1.0a credentials incomplete", critical: false };
  }
  return { name: "Twitter/X", ok: true, message: "OAuth credentials present", critical: false };
}

async function checkHeyGen(): Promise<CheckResult> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return { name: "HeyGen Video", ok: false, message: "Not configured — text-only mode active", critical: false };
  try {
    // v1/user/remaining_quota is obsolete and returns 404. The v3 voices
    // endpoint is a safe, read-only API-key probe and does not create content.
    const res = await fetch("https://api.heygen.com/v3/voices?limit=1", {
      headers: { "x-api-key": key },
      cache: "no-store",
    });
    const reachable = res.ok || res.status === 429;
    return {
      name: "HeyGen Video",
      ok: reachable,
      message: res.ok ? "Video API reachable" : providerMessage(res.status, "HeyGen"),
      critical: false,
    };
  } catch {
    return { name: "HeyGen Video", ok: false, message: "Network error", critical: false };
  }
}

async function checkRecentActivity(): Promise<CheckResult> {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentMessages = await db.usageRecord.count({ where: { createdAt: { gte: oneHourAgo } } });
    return {
      name: "User Activity",
      ok: true,
      message: `${recentMessages} AI interactions in the last hour`,
      critical: false,
    };
  } catch {
    return { name: "User Activity", ok: false, message: "Could not query activity", critical: false };
  }
}

async function checkPastDueSubscriptions(): Promise<CheckResult> {
  try {
    const pastDue = await db.subscription.count({ where: { status: "PAST_DUE" } });
    return {
      name: "Payment Health",
      ok: pastDue === 0,
      message: pastDue === 0 ? "All payments current" : `${pastDue} subscription(s) past due — Stripe will retry automatically`,
      critical: false,
    };
  } catch {
    return { name: "Payment Health", ok: false, message: "Could not query subscriptions", critical: false };
  }
}

async function checkOpenSupportTickets(): Promise<CheckResult> {
  try {
    const open = await db.supportTicket.count({ where: { status: { not: "CLOSED" } } });
    return {
      name: "Support Queue",
      ok: open < 10,
      message: `${open} open ticket${open !== 1 ? "s" : ""}`,
      critical: false,
    };
  } catch {
    return { name: "Support Queue", ok: false, message: "Could not query tickets", critical: false };
  }
}

function statusIcon(check: CheckResult) {
  if (check.ok) return "✅";
  return check.critical ? "🚨" : "⚠️";
}

function statusBadge(check: CheckResult): string {
  if (check.ok) return '<span style="color:#22c55e;font-size:11px;font-weight:700">OK</span>';
  if (check.critical) return '<span style="color:#ef4444;font-size:11px;font-weight:700">CRITICAL</span>';
  return '<span style="color:#f59e0b;font-size:11px;font-weight:700">WARNING</span>';
}

function buildEmailHtml(checks: CheckResult[], criticalFail: boolean, now: Date): string {
  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;
  const criticalFails = checks.filter((c) => !c.ok && c.critical);
  const warnings = checks.filter((c) => !c.ok && !c.critical);

  const statusColor = criticalFail ? "#dc2626" : failed > 0 ? "#d97706" : "#16a34a";
  const statusText = criticalFail ? "CRITICAL FAILURE" : failed > 0 ? "DEGRADED" : "ALL SYSTEMS OPERATIONAL";

  const checkRows = checks.map((c) => `
    <tr>
      <td style="padding:10px 16px;color:#94a3b8;font-size:14px;border-bottom:1px solid #1e293b">${statusIcon(c)} ${escapeHtml(c.name)} ${statusBadge(c)}</td>
      <td style="padding:10px 16px;font-size:13px;border-bottom:1px solid #1e293b;color:${c.ok ? "#86efac" : c.critical ? "#fca5a5" : "#fcd34d"}">${escapeHtml(c.message)}</td>
    </tr>`).join("");

  const fixSection = [...criticalFails, ...warnings].length > 0 ? `
    <div style="background:#1e1e2e;border-left:4px solid ${criticalFail ? "#ef4444" : "#f59e0b"};border-radius:4px;padding:16px;margin:24px 0">
      <p style="margin:0 0 8px;font-weight:700;color:${criticalFail ? "#f87171" : "#fbbf24"};font-size:14px">Action Required</p>
      <ul style="margin:0;padding-left:20px;color:#94a3b8;font-size:13px;line-height:1.8">
        ${criticalFails.map((c) => `<li><strong style="color:#f87171">[CRITICAL] ${escapeHtml(c.name)}:</strong> ${escapeHtml(c.message)}</li>`).join("")}
        ${warnings.map((c) => `<li><strong style="color:#fbbf24">[WARNING] ${escapeHtml(c.name)}:</strong> ${escapeHtml(c.message)}</li>`).join("")}
      </ul>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9">MansaMusaAI</h1>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px">Hourly System Audit — ${escapeHtml(now.toLocaleString("en-GB", { timeZone: "Europe/London", timeZoneName: "short" }))}</p>
    </div>
    <div style="background:${statusColor}20;border:1px solid ${statusColor}40;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
      <p style="margin:0;color:${statusColor};font-size:22px;font-weight:800">${statusText}</p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px">${passed} checks passed · ${failed} issue${failed !== 1 ? "s" : ""} detected</p>
    </div>
    ${fixSection}
    <div style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#1e293b">
            <th style="padding:10px 16px;text-align:left;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:1px">System</th>
            <th style="padding:10px 16px;text-align:left;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:1px">Status</th>
          </tr>
        </thead>
        <tbody>${checkRows}</tbody>
      </table>
    </div>
    <div style="text-align:center;padding-top:16px;border-top:1px solid #1e293b">
      <p style="margin:0;color:#334155;font-size:12px">MansaMusaAI Autonomous Monitoring · Runs every hour · mansamusainitiative.com</p>
    </div>
  </div>
</body>
</html>`;
}

export const GET = withCron(async () => {
  const now = new Date();

  const checks = await Promise.all([
    checkDatabase(),
    checkAnthropicAPI(),
    checkStripe(),
    checkResendEmail(),
    checkInstagram(),
    checkPinterest(),
    checkLinkedIn(),
    checkTwitter(),
    checkHeyGen(),
    checkRecentActivity(),
    checkPastDueSubscriptions(),
    checkOpenSupportTickets(),
  ]);

  const criticalFail = checks.some((c) => !c.ok && c.critical);
  const anyFail = checks.some((c) => !c.ok);

  if (anyFail) {
    const html = buildEmailHtml(checks, criticalFail, now);
    const subject = criticalFail
      ? `🚨 CRITICAL: MansaMusaAI system failure detected — ${now.toLocaleTimeString("en-GB")}`
      : `⚠️ WARNING: MansaMusaAI degraded — ${checks.filter((c) => !c.ok).map((c) => c.name).join(", ")}`;
    await sendEmail(ADMIN_EMAIL, subject, html);
  }

  return {
    timestamp: now.toISOString(),
    status: criticalFail ? "critical" : anyFail ? "degraded" : "healthy",
    passed: checks.filter((c) => c.ok).length,
    failed: checks.filter((c) => !c.ok).length,
    checks: checks.map((c) => ({
      name: c.name,
      ok: c.ok,
      severity: c.ok ? "ok" : c.critical ? "critical" : "warning",
      message: c.message,
    })),
    emailSent: anyFail,
  };
});
