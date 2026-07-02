import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";

const ADMIN_EMAIL = process.env.REPORT_EMAIL ?? "ai@mansamusainitiative.com";

export const GET = withCron(async () => {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) {
    return { skipped: true, reason: "PINTEREST_ACCESS_TOKEN not configured" };
  }

  const res = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    return { valid: true, status: res.status };
  }

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

  await sendEmail(
    ADMIN_EMAIL,
    "ACTION REQUIRED: Pinterest token expired — regenerate now",
    html
  );

  return { valid: false, status: res.status, notifiedTo: ADMIN_EMAIL };
});
