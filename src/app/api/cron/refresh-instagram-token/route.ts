import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.REPORT_EMAIL ?? "ai@mansamusainitiative.com";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!currentToken) {
    return NextResponse.json(
      { error: "INSTAGRAM_ACCESS_TOKEN env var is not set" },
      { status: 500 }
    );
  }

  // Refresh a long-lived Instagram token (valid for another 60 days)
  const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;

  let data: { access_token?: string; token_type?: string; expires_in?: number };
  try {
    const res = await fetch(url);
    data = await res.json();
    if (!res.ok || !data.access_token) {
      const errMsg = JSON.stringify(data);
      console.error("[cron/refresh-instagram-token] Instagram API error:", errMsg);
      return NextResponse.json(
        { error: "Instagram API returned an error", details: errMsg },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[cron/refresh-instagram-token] fetch failed:", err);
    return NextResponse.json({ error: "Failed to reach Instagram API" }, { status: 502 });
  }

  const newToken = data.access_token;
  const expiresInSeconds = data.expires_in ?? 5184000; // default 60 days
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const expiresAtStr = expiresAt.toISOString().split("T")[0];

  console.log("[cron/refresh-instagram-token] SUCCESS");
  console.log("[cron/refresh-instagram-token] New token:", newToken);
  console.log("[cron/refresh-instagram-token] Expires at:", expiresAtStr);
  console.log(
    "[cron/refresh-instagram-token] ACTION REQUIRED: Update INSTAGRAM_ACCESS_TOKEN in Vercel env vars before",
    expiresAtStr
  );

  // Email Darren so he can manually update the Vercel env var
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <p style="font-weight:700;font-size:18px;margin:0 0 24px">Mansa<span style="color:#6366f1">Musa</span>AI</p>
      <h2 style="font-size:20px;margin:0 0 12px">Instagram Token Refreshed — Action Required</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        Your Instagram long-lived access token has been automatically refreshed and expires on
        <strong>${expiresAtStr}</strong>.
      </p>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        Please update the <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">INSTAGRAM_ACCESS_TOKEN</code>
        environment variable in your Vercel project settings before that date to prevent social posting from stopping.
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;word-break:break-all">
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">New Token</p>
        <p style="margin:0;font-size:13px;color:#1a1a2e;font-family:monospace">${newToken}</p>
      </div>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        Steps:
      </p>
      <ol style="color:#4b5563;font-size:14px;line-height:1.8">
        <li>Go to <a href="https://vercel.com" style="color:#6366f1">vercel.com</a> → your project → Settings → Environment Variables</li>
        <li>Find <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">INSTAGRAM_ACCESS_TOKEN</code></li>
        <li>Replace the value with the new token above</li>
        <li>Redeploy the project</li>
      </ol>
      <p style="color:#9ca3af;font-size:12px;margin-top:32px">This email was sent automatically by the monthly Instagram token refresh cron job.</p>
    </div>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `Instagram Token Refreshed — update Vercel before ${expiresAtStr}`,
    html
  );

  return NextResponse.json({
    ok: true,
    newToken,
    expiresAt: expiresAtStr,
    message: `Token refreshed successfully. Expires ${expiresAtStr}. Notification sent to ${ADMIN_EMAIL}.`,
  });
}
