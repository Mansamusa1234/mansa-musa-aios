import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const storedState = request.cookies.get("linkedin_oauth_state")?.value;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || url.origin).replace(/\/$/, "");
  const session = await auth();

  if (!session?.user?.id) {
    const callbackUrl = request.url;
    return NextResponse.redirect(`${appUrl}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

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

  const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string };
  if (!token.access_token) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin=token_error`);
  }

  const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const profile = await profileResponse.json() as { sub?: string };
  if (!profileResponse.ok || !profile.sub) {
    console.error("LinkedIn profile lookup failed", profileResponse.status);
    return NextResponse.redirect(`${appUrl}/settings?linkedin=profile_error`);
  }

  await db.$transaction([
    db.account.deleteMany({ where: { provider: "linkedin-social", userId: session.user.id } }),
    db.account.create({
      data: {
        userId: session.user.id,
        type: "oauth",
        provider: "linkedin-social",
        providerAccountId: profile.sub,
        access_token: token.access_token,
        refresh_token: token.refresh_token ?? null,
        expires_at: token.expires_in ? Math.floor(Date.now() / 1000) + token.expires_in : null,
        token_type: "Bearer",
        scope: token.scope ?? null,
      },
    }),
  ]);
  const response = NextResponse.redirect(`${appUrl}/settings?linkedin=authorized`);
  response.cookies.delete("linkedin_oauth_state");
  return response;
}
