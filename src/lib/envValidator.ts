/**
 * Validates required environment variables at startup.
 * Throws immediately with a clear message if anything critical is missing.
 * Run this in instrumentation.ts so it fires before any request is served.
 */

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
  group: string;
}

const ENV_MANIFEST: EnvVar[] = [
  // ── Auth (hard required — nothing works without these) ──────────────────────
  { key: "NEXTAUTH_SECRET",      required: true,  description: "NextAuth JWT encryption secret",         group: "Auth" },
  { key: "GOOGLE_CLIENT_ID",     required: true,  description: "Google OAuth client ID",                 group: "Auth" },
  { key: "GOOGLE_CLIENT_SECRET", required: true,  description: "Google OAuth client secret",             group: "Auth" },

  // ── Database ──────────────────────────────────────────────────────────
  { key: "DATABASE_URL",         required: true,  description: "PostgreSQL connection string",           group: "Database" },

  // ── Stripe ───────────────────────────────────────────────────────────
  { key: "STRIPE_SECRET_KEY",         required: true,  description: "Stripe secret API key",                  group: "Stripe" },
  { key: "STRIPE_WEBHOOK_SECRET",     required: true,  description: "Stripe webhook signing secret",          group: "Stripe" },
  { key: "STRIPE_PRICE_STARTER",      required: false, description: "Stripe price ID for Starter plan",       group: "Stripe" },
  { key: "STRIPE_PRICE_PRO",          required: false, description: "Stripe price ID for Pro plan",           group: "Stripe" },
  { key: "STRIPE_PRICE_PROFESSIONAL", required: false, description: "Stripe price ID for Professional plan",  group: "Stripe" },
  { key: "STRIPE_PRICE_ENTERPRISE",   required: false, description: "Stripe price ID for Enterprise plan",    group: "Stripe" },

  // ── AI ───────────────────────────────────────────────────────────────
  { key: "ANTHROPIC_API_KEY",    required: true,  description: "Anthropic Claude API key",               group: "AI" },
  { key: "OPENAI_API_KEY",       required: false, description: "OpenAI API key for GPT models",          group: "AI" },
  { key: "XAI_API_KEY",          required: false, description: "xAI Grok API key",                       group: "AI" },
  { key: "GOOGLE_AI_API_KEY",    required: false, description: "Google Gemini API key",                  group: "AI" },
  { key: "MISTRAL_API_KEY",      required: false, description: "Mistral API key",                        group: "AI" },
  { key: "OPENROUTER_API_KEY",   required: false, description: "OpenRouter API key",                     group: "AI" },

  // ── Email ────────────────────────────────────────────────────────────
  { key: "RESEND_API_KEY",       required: false, description: "Resend email API key (password reset, welcome emails)", group: "Email" },

  // ── Social ───────────────────────────────────────────────────────────
  { key: "TWITTER_API_KEY",            required: false, description: "Twitter/X API key",               group: "Social" },
  { key: "TWITTER_API_SECRET",         required: false, description: "Twitter/X API secret",            group: "Social" },
  { key: "TWITTER_ACCESS_TOKEN",       required: false, description: "Twitter/X access token",          group: "Social" },
  { key: "TWITTER_ACCESS_TOKEN_SECRET",required: false, description: "Twitter/X access token secret",  group: "Social" },
  { key: "LINKEDIN_ACCESS_TOKEN",      required: false, description: "LinkedIn access token",           group: "Social" },
  { key: "LINKEDIN_PERSON_ID",         required: false, description: "LinkedIn person URN for posting", group: "Social" },
  { key: "INSTAGRAM_ACCESS_TOKEN",     required: false, description: "Instagram access token",          group: "Social" },
  { key: "FACEBOOK_PAGE_ACCESS_TOKEN", required: false, description: "Facebook page access token",      group: "Social" },
  { key: "FACEBOOK_PAGE_ID",           required: false, description: "Facebook page ID",                group: "Social" },
  { key: "TIKTOK_ACCESS_TOKEN",        required: false, description: "TikTok access token",             group: "Social" },
  { key: "YOUTUBE_CLIENT_ID",          required: false, description: "YouTube OAuth client ID",         group: "Social" },
  { key: "YOUTUBE_CLIENT_SECRET",      required: false, description: "YouTube OAuth client secret",     group: "Social" },
  { key: "YOUTUBE_REFRESH_TOKEN",      required: false, description: "YouTube OAuth refresh token",     group: "Social" },
  { key: "PINTEREST_ACCESS_TOKEN",     required: false, description: "Pinterest access token",          group: "Social" },
  { key: "THREADS_ACCESS_TOKEN",       required: false, description: "Threads access token",            group: "Social" },

  // ── Video ────────────────────────────────────────────────────────────
  { key: "HEYGEN_API_KEY",       required: false, description: "HeyGen video generation API key",       group: "Video" },
  { key: "HEYGEN_AVATAR_ID",     required: false, description: "HeyGen avatar ID for social videos",    group: "Video" },
  { key: "HEYGEN_VOICE_ID",      required: false, description: "HeyGen voice ID for social videos",     group: "Video" },

  // ── Cron ────────────────────────────────────────────────────────────
  { key: "CRON_SECRET",          required: false, description: "Shared secret for Vercel cron routes",  group: "Cron" },

  // ── Monitoring ───────────────────────────────────────────────────────
  { key: "NEXT_PUBLIC_SENTRY_DSN", required: false, description: "Sentry DSN for error tracking",      group: "Monitoring" },
];

export interface EnvCheckResult {
  ok: boolean;
  missing: { key: string; description: string; group: string }[];
  optional: { key: string; description: string; group: string }[];
  present: string[];
}

export function checkEnv(): EnvCheckResult {
  const missing: EnvCheckResult["missing"] = [];
  const optional: EnvCheckResult["optional"] = [];
  const present: string[] = [];

  for (const v of ENV_MANIFEST) {
    const val = process.env[v.key];
    if (val && val.trim() !== "") {
      present.push(v.key);
    } else if (v.required) {
      missing.push({ key: v.key, description: v.description, group: v.group });
    } else {
      optional.push({ key: v.key, description: v.description, group: v.group });
    }
  }

  return { ok: missing.length === 0, missing, optional, present };
}

/** Call at app startup — throws if any required env var is missing */
export function assertEnv(): void {
  const result = checkEnv();
  if (!result.ok) {
    const lines = result.missing.map((v) => `  ❌ ${v.key} — ${v.description} [${v.group}]`).join("\n");
    const msg = `\n\n🚨 MISSING REQUIRED ENVIRONMENT VARIABLES:\n${lines}\n\nAdd these to your Vercel project settings → Environment Variables.\n`;
    console.error(msg);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required env vars: ${result.missing.map((v) => v.key).join(", ")}`);
    }
  }

  if (result.optional.length > 0) {
    const lines = result.optional.map((v) => `  ⚠️  ${v.key} — ${v.description} [${v.group}]`).join("\n");
    console.warn(`\n[env] Optional env vars not set (features will be degraded):\n${lines}\n`);
  }

  console.log(`[env] ✅ ${result.present.length} env vars verified OK`);
}
