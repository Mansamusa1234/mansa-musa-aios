import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = request.cookies.get("linkedin_oauth_state")?.value;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || url.origin).replace(/\/$/, "");

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin=denied`);
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid LinkedIn OAuth response" }, { status: 400 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "LinkedIn credentials are not configured" }, { status: 500 });
  }

  const redirectUri = `${appUrl}/api/linkedin/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    console.error("LinkedIn token exchange failed", tokenResponse.status, detail);
    return NextResponse.redirect(`${appUrl}/settings?linkedin=token_error`);
  }

  const token = await tokenResponse.json() as { access_token?: string; expires_in?: number; scope?: string };
  if (!token.access_token) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin=token_error`);
  }

  // Do not expose the access token to the browser. A persistent encrypted token store
  // can be wired here once the production database/user-session binding is confirmed.
  const response = NextResponse.redirect(`${appUrl}/settings?linkedin=authorized`);
  response.cookies.delete("linkedin_oauth_state");
  return response;
}
