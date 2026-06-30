import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    // Step 1: Redirect to Google OAuth
    const params = new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
      redirect_uri: "https://mansamusainitiative.com/api/auth/",
      response_type: "code",
      scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
      access_type: "offline",
      prompt: "consent",
    });
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/auth?${params}`);
  }

  // Step 2: Exchange code for refresh token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
      client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
      redirect_uri: "https://mansamusainitiative.com/api/auth/",
      grant_type: "authorization_code",
    }),
  });

  const data = await tokenRes.json();

  return NextResponse.json({
    message: "Copy the refresh_token below and add it to Vercel as YOUTUBE_REFRESH_TOKEN",
    refresh_token: data.refresh_token,
    access_token: data.access_token,
  });
}
