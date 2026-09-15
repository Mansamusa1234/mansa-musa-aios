import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");

  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = `${appUrl}/api/linkedin/connect`;
    return NextResponse.redirect(`${appUrl}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  if (!clientId) {
    return NextResponse.json({ error: "LINKEDIN_CLIENT_ID is not configured" }, { status: 500 });
  }

  const state = crypto.randomBytes(32).toString("hex");
  const redirectUri = `${appUrl}/api/linkedin/callback`;
  const scope = process.env.LINKEDIN_SCOPES || "openid profile email w_member_social";

  const authorizeUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", scope);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
