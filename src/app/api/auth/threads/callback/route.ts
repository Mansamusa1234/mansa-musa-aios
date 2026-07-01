import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return new NextResponse(`<html><body><h2>Error: ${error ?? "no code returned"}</h2></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }

  const appId = process.env.THREADS_APP_ID;
  const appSecret = process.env.THREADS_APP_SECRET;
  const redirectUri = process.env.THREADS_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    return new NextResponse("<html><body><h2>Missing THREADS_APP_ID, THREADS_APP_SECRET, or THREADS_REDIRECT_URI env vars</h2></body></html>", {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Exchange code for short-lived token
  const tokenRes = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return new NextResponse(`<html><body><h2>Token exchange failed</h2><pre>${JSON.stringify(tokenData, null, 2)}</pre></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Exchange for long-lived token (60-day)
  const longRes = await fetch(
    `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_id=${appId}&client_secret=${appSecret}&access_token=${tokenData.access_token}`
  );
  const longData = await longRes.json();
  const finalToken = longData.access_token ?? tokenData.access_token;

  // Get Threads user ID
  const meRes = await fetch(`https://graph.threads.net/v1.0/me?access_token=${finalToken}`);
  const meData = await meRes.json();

  return new NextResponse(
    `<html><body style="font-family:monospace;padding:20px;background:#111;color:#0f0">
    <h2 style="color:#fff">Threads OAuth Complete</h2>
    <p><strong style="color:#fff">THREADS_ACCESS_TOKEN:</strong><br>
    <textarea rows="3" style="width:100%;background:#222;color:#0f0;padding:8px">${finalToken}</textarea></p>
    <p><strong style="color:#fff">THREADS_USER_ID:</strong><br>
    <input value="${meData.id ?? "unknown"}" style="width:100%;background:#222;color:#0f0;padding:8px" readonly /></p>
    <p style="color:#fff">Copy both values into Vercel environment variables, then redeploy.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
