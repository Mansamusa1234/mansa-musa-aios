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

// Common scanner/bot user-agent fragments — block at the edge before they hit any route
const BLOCKED_UA_PATTERNS = [
  "sqlmap", "nikto", "nmap", "masscan", "zgrab", "nuclei",
  "dirbuster", "gobuster", "wfuzz", "hydra", "metasploit",
  "burpsuite", "burp suite", "acunetix", "nessus", "openvas",
  "python-requests/0",
  "go-http-client/1",
];

// Paths that scanners love to probe — return 404 immediately
const SCANNER_PATHS = [
  "/.env", "/.git", "/wp-admin", "/wp-login", "/phpmyadmin",
  "/admin.php", "/config.php", "/xmlrpc.php", "/.htaccess",
  "/etc/passwd", "/proc/self", "/.aws", "/.ssh",
];

function isScannerUA(ua: string | null): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return BLOCKED_UA_PATTERNS.some((p) => lower.includes(p));
}

function isScannerPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return SCANNER_PATHS.some((p) => lower.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent");

  // Block scanners at the edge — 404 so they get no information
  if (isScannerPath(pathname) || isScannerUA(ua)) {
    return new NextResponse(null, { status: 404 });
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
    secureCookie: process.env.NODE_ENV === "production",
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
