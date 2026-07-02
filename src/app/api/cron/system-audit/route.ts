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
  if (!token) return { name: "Instagram", ok: false, message: "Token not configured", critical: false };
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
    const data = await res.json() as { id?: string; error?: { message: string } };
    if (data.error) return { name: "Instagram", ok: false, message: data.error.message, critical: false };
    return { name: "Instagram", ok: true, message: "Token valid", critical: false };
  } catch {
    return { name: "Instagram", ok: false, message: "Network error", critical: false };
  }
}

async function checkPinterest(): Promise<CheckResult> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) return { name: "Pinterest", ok: false, message: "Token not configured", critical: false };
  try {
    const res = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { name: "Pinterest", ok: res.ok, message: res.ok ? "Token valid" : `Token expired (HTTP ${res.status}) — regenerate at developers.pinterest.com`, critical: false };
  } catch {
    return { name: "Pinterest", ok: false, message: "Network error", critical: false };
  }
}

async function checkLinkedIn(): Promise<CheckResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) return { name: "LinkedIn", ok: false, message: "Token not configured", critical: false };
  try {
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { name: "LinkedIn", ok: res.ok, message: res.ok ? "Token valid" : `HTTP ${res.status}`, critical: false };
  } catch {
    return { name: "LinkedIn", ok: false, message: "Network error", critical: false };
  }
}

async function checkTwitter(): Promise<CheckResult> {
  const token = process.env.TWITTER_ACCESS_TOKEN;
  const key = process.env.TWITTER_API_KEY;
  if (!token || !key) return { name: "Twitter/X", ok: false, message: "Tokens not configured", critical: false };
  return { name: "Twitter/X", ok: true, message: "Credentials present", critical: false };
}

async function checkHeyGen(): Promise<CheckResult> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) return { name: "HeyGen Video", ok: false, message: "HEYGEN_API_KEY not set — text-only mode active", critical: false };
  try {
    const res = await fetch("https://api.heygen.com/v1/user/remaining_quota", {
      headers: { "X-Api-Key": key },
    });
    return { name: "HeyGen Video", ok: res.ok, message: res.ok ? "Video generation available" : `HTTP ${res.status}`, critical: false };
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

function statusIcon(ok: boolean) {
  return ok ? "✅" : "❌";
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
      <td style="padding:10px 16px;color:#94a3b8;font-size:14px;border-bottom:1px solid #1e293b">${statusIcon(c.ok)} ${c.name}${c.critical ? ' <span style="color:#ef4444;font-size:11px">CRITICAL</span>' : ""}</td>
      <td style="padding:10px 16px;font-size:13px;border-bottom:1px solid #1e293b;color:${c.ok ? "#86efac" : "#fca5a5"}">${c.message}</td>
    </tr>`).join("");

  const fixSection = [...criticalFails, ...warnings].length > 0 ? `
    <div style="background:#1e1e2e;border-left:4px solid #ef4444;border-radius:4px;padding:16px;margin:24px 0">
      <p style="margin:0 0 8px;font-weight:700;color:#f87171;font-size:14px">Action Required</p>
      <ul style="margin:0;padding-left:20px;color:#94a3b8;font-size:13px;line-height:1.8">
        ${criticalFails.map((c) => `<li><strong style="color:#f87171">[CRITICAL] ${c.name}:</strong> ${c.message}</li>`).join("")}
        ${warnings.map((c) => `<li><strong style="color:#fbbf24">[WARNING] ${c.name}:</strong> ${c.message}</li>`).join("")}
      </ul>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9">MansaMusaAI</h1>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px">Hourly System Audit — ${now.toLocaleString("en-GB", { timeZone: "Europe/London" })} GMT</p>
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
    checks: checks.map((c) => ({ name: c.name, ok: c.ok, message: c.message })),
    emailSent: anyFail,
  };
});
