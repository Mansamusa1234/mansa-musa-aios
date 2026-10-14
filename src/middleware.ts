import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  "/dashboard", "/chat", "/billing", "/admin",
  "/affiliate", "/agent-dashboard", "/analytics", "/arena",
  "/intelligence", "/marketplace", "/news", "/portal",
  "/referrals", "/revenue", "/team", "/settings", "/crm", "/receptionist",
  "/workforce", "/support", "/calendar", "/model-hub",
  "/compete", "/wisdom", "/wisdom-leaderboard",
  "/onboarding", "/whatsapp", "/email-automation", "/agents",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
    // Same rule Auth.js uses when it sets the cookie: the __Secure- name only over HTTPS.
    secureCookie: req.nextUrl.protocol === "https:",
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
