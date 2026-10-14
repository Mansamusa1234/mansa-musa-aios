import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { YOUTUBE_ACCOUNT } from "@/lib/social-automation";

// Admin-only YouTube connection for social publishing. Visit /api/auth while signed in as an
// administrator: Google asks for consent and returns here. The refresh token is stored server-side
// (Account provider "youtube-social"); it is never shown, logged or copied by hand.
// The redirect URI must match the one registered for YOUTUBE_CLIENT_ID in Google Cloud.
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "https://mansamusainitiative.com/api/auth/";
const STATE_COOKIE = "yt_oauth_state";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in as an administrator first." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
    return NextResponse.json({ error: "YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set first." }, { status: 503 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();

  if (!code) {
    if (url.searchParams.get("error")) return NextResponse.json({ error: "Google consent was not granted." }, { status: 400 });
    const state = crypto.randomBytes(24).toString("hex");
    cookieStore.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
    const params = new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/auth?${params}`);
  }

  // CSRF protection: the callback must carry the state this browser was given.
  const expected = cookieStore.get(STATE_COOKIE)?.value ?? "";
  const received = url.searchParams.get("state") ?? "";
  cookieStore.delete(STATE_COOKIE);
  if (!expected || expected.length !== received.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return NextResponse.json({ error: "This connection link has expired. Start again from /api/auth." }, { status: 400 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const data = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || typeof data.refresh_token !== "string") {
    console.error("[youtube-connect] token exchange failed", tokenRes.status, typeof data?.error === "string" ? data.error : "");
    return NextResponse.json({ error: "Google did not issue a refresh token. Check the YouTube OAuth client secret and try again." }, { status: 502 });
  }

  const tokens = {
    refresh_token: data.refresh_token as string,
    access_token: typeof data.access_token === "string" ? data.access_token : null,
    expires_at: typeof data.expires_in === "number" ? Math.floor(Date.now() / 1000) + data.expires_in : null,
    scope: typeof data.scope === "string" ? data.scope : null,
    token_type: "Bearer",
  };
  await db.account.upsert({
    where: { provider_providerAccountId: YOUTUBE_ACCOUNT },
    create: { userId: session.user.id, type: "oauth", ...YOUTUBE_ACCOUNT, ...tokens },
    update: tokens,
  });
  return NextResponse.json({ connected: true, message: "YouTube is connected for publishing. Nothing needs to be copied." });
}
