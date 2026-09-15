import { Redis } from "@upstash/redis";
import { db } from "@/lib/db";
import { withCron } from "@/lib/cronUtils";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.REPORT_EMAIL ?? "ai@mansamusainitiative.com";
const STATE_KEY = "monitor:core-health:last-state";

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export const GET = withCron(async () => {
  const startedAt = Date.now();
  const issues: string[] = [];

  for (const key of ["DATABASE_URL", "NEXTAUTH_SECRET", "CRON_SECRET"] as const) {
    if (!process.env[key]) issues.push(`${key} is missing`);
  }

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    issues.push("Database is unreachable");
  }

  const status = issues.length === 0 ? "healthy" : "critical";
  const redis = redisClient();
  let stateChanged = false;

  if (redis) {
    const previous = await redis.get<string>(STATE_KEY).catch(() => null);
    stateChanged = previous !== null && previous !== status;
    await redis.set(STATE_KEY, status, { ex: 7 * 24 * 60 * 60 }).catch(() => null);
  }

  if (stateChanged) {
    const recovered = status === "healthy";
    const subject = recovered
      ? "✅ MansaMusaAI core service recovered"
      : "🚨 MansaMusaAI core service needs attention";
    const details = recovered ? "All minute-by-minute core checks are passing." : issues.join("; ");
    await sendEmail(
      ADMIN_EMAIL,
      subject,
      `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px"><h2>${subject}</h2><p>${details}</p><p style="color:#64748b">Checked ${new Date().toISOString()}</p></div>`,
    ).catch((error) => console.error("[health-monitor] alert failed", error));
  }

  console.log(JSON.stringify({ level: status === "healthy" ? "info" : "error", message: "core_health", status, issueCount: issues.length, ms: Date.now() - startedAt }));
  return { status, issueCount: issues.length, stateChanged, alerting: redis ? "state-change" : "hourly-audit-fallback", ms: Date.now() - startedAt };
});
