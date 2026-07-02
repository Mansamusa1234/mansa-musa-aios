import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";

const ADMIN_EMAIL = process.env.REPORT_EMAIL ?? "ai@mansamusainitiative.com";

export const GET = withCron(async () => {
  const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!currentToken) {
    return { skipped: true, reason: "INSTAGRAM_ACCESS_TOKEN not configured" };
  }

  const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;

  const res = await fetch(url);
  const data = await res.json() as { access_token?: string; token_type?: string; expires_in?: number };

  if (!res.ok || !data.access_token) {
    throw new Error(`Instagram API error: ${JSON.stringify(data)}`);
  }

  const newToken = data.access_token;
  const expiresInSeconds = data.expires_in ?? 5184000;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const expiresAtStr = expiresAt.toISOString().split("T")[0];

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <p style="font-weight:700;font-size:18px;margin:0 0 24px">MansaMusaAI</p>
      <h2 style="font-size:20px;margin:0 0 12px">Instagram Token Refreshed — Action Required</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        Your Instagram long-lived access token has been automatically refreshed and expires on
        <strong>${expiresAtStr}</strong>.
      </p>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        Please update the <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">INSTAGRAM_ACCESS_TOKEN</code>
        environment variable in your Vercel project settings before that date.
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;word-break:break-all">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">New Token</p>
        <p style="margin:0;font-size:13px;color:#1a1a2e;font-family:monospace">${newToken}</p>
      </div>
      <ol style="color:#4b5563;font-size:14px;line-height:1.8">
        <li>Go to vercel.com &rarr; your project &rarr; Settings &rarr; Environment Variables</li>
        <li>Find <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">INSTAGRAM_ACCESS_TOKEN</code></li>
        <li>Replace the value with the new token above</li>
        <li>Redeploy the project</li>
      </ol>
      <p style="color:#9ca3af;font-size:12px;margin-top:32px">Sent automatically by the monthly Instagram token refresh cron.</p>
    </div>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `Instagram Token Refreshed — update Vercel before ${expiresAtStr}`,
    html
  );

  return { newToken, expiresAt: expiresAtStr, notifiedTo: ADMIN_EMAIL };
});
