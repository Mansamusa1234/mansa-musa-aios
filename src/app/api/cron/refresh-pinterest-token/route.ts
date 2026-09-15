import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";
import { Redis } from "@upstash/redis";

const ADMIN_EMAIL = process.env.REPORT_EMAIL ?? "ai@mansamusainitiative.com";
const STATE_KEY = "monitor:pinterest-token:last-state";

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export const GET = withCron(async () => {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) {
    return { skipped: true, reason: "PINTEREST_ACCESS_TOKEN not configured" };
  }

  const res = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    await redisClient()?.set(STATE_KEY, "valid", { ex: 7 * 24 * 60 * 60 }).catch(() => null);
    return { valid: true, status: res.status };
  }

  const redis = redisClient();
  const previous = await redis?.get<string>(STATE_KEY).catch(() => null);
  const shouldNotify = !redis || previous !== "invalid";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <p style="font-weight:700;font-size:18px;margin:0 0 24px">MansaMusaAI</p>
      <h2 style="font-size:20px;margin:0 0 12px;color:#dc2626">Pinterest Token Expired — Action Required</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        Your Pinterest access token has expired (HTTP ${res.status}). Pinterest posts will not work until you regenerate it.
      </p>
      <h3 style="font-size:15px;margin:24px 0 8px">Steps to fix:</h3>
      <ol style="color:#4b5563;font-size:14px;line-height:1.8">
        <li>Go to <a href="https://developers.pinterest.com/apps/" style="color:#e60023">developers.pinterest.com/apps/</a></li>
        <li>Open your MansaMusaAI app</li>
        <li>Click <strong>Generate access token</strong> (Trial access section)</li>
        <li>Copy the new token</li>
        <li>Go to <a href="https://vercel.com" style="color:#e60023">vercel.com</a> → your project → Settings → Environment Variables</li>
        <li>Update <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">PINTEREST_ACCESS_TOKEN</code> with the new value</li>
        <li>Redeploy the project</li>
      </ol>
      <p style="color:#9ca3af;font-size:12px;margin-top:32px">
        Note: Trial tokens expire every 24 hours. To avoid this, upgrade your Pinterest app to Production access
        by submitting a video demo at developers.pinterest.com.
      </p>
    </div>
  `;

  if (shouldNotify) {
    await sendEmail(
      ADMIN_EMAIL,
      "ACTION REQUIRED: Pinterest token expired — connect Production access",
      html
    );
  }
  await redis?.set(STATE_KEY, "invalid", { ex: 7 * 24 * 60 * 60 }).catch(() => null);

  return { valid: false, status: res.status, notified: shouldNotify };
});
