import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkEnv } from "@/lib/envValidator";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; message?: string; ms?: number }> = {};

  try {
    const t = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database = { ok: true, ms: Date.now() - t };
  } catch (err) {
    checks.database = { ok: false, message: err instanceof Error ? err.message : "DB unreachable" };
  }

  const envResult = checkEnv();
  checks.env = {
    ok: envResult.ok,
    message: envResult.ok
      ? `${envResult.present.length} vars present`
      : `Missing required: ${envResult.missing.map((v) => v.key).join(", ")}`,
  };

  checks.auth = {
    ok: !!process.env.NEXTAUTH_SECRET && !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    message: [
      !process.env.NEXTAUTH_SECRET && "NEXTAUTH_SECRET missing",
      !process.env.GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID missing",
      !process.env.GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET missing",
    ].filter(Boolean).join(", ") || "OK",
  };

  const socialPlatforms = {
    twitter:   !!process.env.TWITTER_API_KEY && !!process.env.TWITTER_ACCESS_TOKEN,
    linkedin:  !!process.env.LINKEDIN_ACCESS_TOKEN,
    instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    facebook:  !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    tiktok:    !!process.env.TIKTOK_ACCESS_TOKEN,
    youtube:   !!process.env.YOUTUBE_CLIENT_ID && !!process.env.YOUTUBE_REFRESH_TOKEN,
    pinterest: !!process.env.PINTEREST_ACCESS_TOKEN,
    threads:   !!process.env.THREADS_ACCESS_TOKEN,
  };
  const socialReady = Object.values(socialPlatforms).filter(Boolean).length;
  checks.social = {
    ok: socialReady > 0,
    message: `${socialReady}/8 platforms configured — ${Object.entries(socialPlatforms).filter(([,v]) => v).map(([k]) => k).join(", ") || "none"}`,
  };

  checks.heygen = {
    ok: !!process.env.HEYGEN_API_KEY,
    message: process.env.HEYGEN_API_KEY ? "Configured — video posts enabled" : "Not configured — text-only mode active",
  };

  checks.email = {
    ok: !!process.env.RESEND_API_KEY,
    message: process.env.RESEND_API_KEY ? "Resend configured" : "RESEND_API_KEY missing — emails will not send",
  };

  checks.ai = {
    ok: !!process.env.ANTHROPIC_API_KEY,
    message: process.env.ANTHROPIC_API_KEY ? "Anthropic configured" : "ANTHROPIC_API_KEY missing",
  };

  const allOk = Object.values(checks).every((c) => c.ok);
  const critical = checks.database.ok && checks.auth.ok && checks.ai.ok;

  return NextResponse.json(
    {
      status: allOk ? "ok" : critical ? "degraded" : "error",
      critical,
      checks,
      missingEnvVars: envResult.missing,
      optionalMissingEnvVars: envResult.optional,
      totalMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : critical ? 207 : 503 }
  );
}
