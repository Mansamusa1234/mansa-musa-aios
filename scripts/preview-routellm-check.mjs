// Preview builds only: one tiny RouteLLM request to prove the Preview ABACUS_API_KEY works.
// Writes a sanitised result (never the key) to the build log and public/_diagnostics/routellm.json.
// No-op for Production and local builds. Never fails the build.
import { mkdirSync, writeFileSync } from "node:fs";

if (process.env.VERCEL_ENV !== "preview") {
  console.log("[routellm-check] skipped (not a Vercel Preview build)");
  process.exit(0);
}
const key = process.env.ABACUS_API_KEY?.trim();
const started = Date.now();
let result;
if (!key) {
  result = { ok: false, error: "ABACUS_API_KEY is not set for Preview" };
} else {
  try {
    const res = await fetch(process.env.ABACUS_ROUTELLM_URL || "https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.ABACUS_ROUTELLM_MODEL || "route-llm", max_tokens: 20,
        messages: [{ role: "user", content: "Reply with exactly: RouteLLM OK" }] }),
      signal: AbortSignal.timeout(45000),
    });
    const body = await res.json().catch(() => ({}));
    result = { ok: res.ok, status: res.status, ms: Date.now() - started, model: body?.model ?? null,
      reply: body?.choices?.[0]?.message?.content?.slice(0, 80) ?? null, usage: body?.usage ?? null,
      error: res.ok ? null : JSON.stringify(body).split(key).join("[redacted]").slice(0, 300) };
  } catch (err) {
    result = { ok: false, ms: Date.now() - started, error: err instanceof Error ? err.message : String(err) };
  }
}
const record = { checkedAt: new Date().toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null, ...result };
console.log("[routellm-check]", JSON.stringify(record));
mkdirSync("public/_diagnostics", { recursive: true });
writeFileSync("public/_diagnostics/routellm.json", JSON.stringify(record, null, 2));

// Which integrations Preview can exercise: presence only, never values.
const NAMES = ["DATABASE_URL", "NEXTAUTH_SECRET", "CRON_SECRET", "ANTHROPIC_API_KEY", "ABACUS_API_KEY", "ABACUS_WORKER_URL", "ABACUS_WORKER_TOKEN",
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_STARTER", "STRIPE_PRICE_PROFESSIONAL", "STRIPE_PRICE_ENTERPRISE",
  "FACEBOOK_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ID", "INSTAGRAM_USER_ID", "INSTAGRAM_ACCESS_TOKEN", "TIKTOK_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "HEYGEN_API_KEY", "BLOB_READ_WRITE_TOKEN",
  "SOCIAL_VIDEO_BASE_URL", "SOCIAL_DIRECT_PUBLISH", "SOCIAL_HEYGEN_ENABLED", "RESEND_API_KEY", "UPSTASH_REDIS_REST_URL"];
const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
const env = {
  checkedAt: record.checkedAt,
  commit: record.commit,
  stripeMode: stripeKey.startsWith("sk_test_") || stripeKey.startsWith("rk_test_") ? "test" : stripeKey ? "LIVE" : "unset",
  set: Object.fromEntries(NAMES.map((name) => [name, Boolean(process.env[name]?.trim())])),
};
console.log("[env-inventory]", JSON.stringify(env));
writeFileSync("public/_diagnostics/env.json", JSON.stringify(env, null, 2));
