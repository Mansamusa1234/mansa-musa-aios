// Preview builds only: one tiny RouteLLM request to prove the Preview ABACUS_API_KEY works,
// plus read-only env, connection and database checks.
// Results (never secret values) go to the Vercel build log only, which needs team access. Nothing is written
// under public/, so no report is ever served by the deployment.
// No-op for Production and local builds. Never fails the build.

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

// Read-only connection checks (identity / balance only; nothing is posted or spent).
const secrets = ["FACEBOOK_PAGE_ACCESS_TOKEN", "INSTAGRAM_ACCESS_TOKEN", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "HEYGEN_API_KEY"]
  .map((n) => process.env[n]).filter(Boolean);
const scrub = (text) => secrets.reduce((t, s) => t.split(s).join("[redacted]"), String(text)).slice(0, 240);
async function probe(fn) {
  try { return await fn(); } catch (err) { return { ok: false, error: scrub(err instanceof Error ? err.message : err) }; }
}
async function getJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}
const e = process.env;
const connections = {
  checkedAt: record.checkedAt,
  commit: record.commit,
  facebook: !(e.FACEBOOK_PAGE_ACCESS_TOKEN && e.FACEBOOK_PAGE_ID) ? { ok: false, error: "not configured" } : await probe(async () => {
    const { res, body } = await getJson(`https://graph.facebook.com/v19.0/${encodeURIComponent(e.FACEBOOK_PAGE_ID)}?fields=id,name&access_token=${encodeURIComponent(e.FACEBOOK_PAGE_ACCESS_TOKEN)}`);
    return res.ok ? { ok: true, page: body.name } : { ok: false, status: res.status, error: scrub(JSON.stringify(body.error ?? body)) };
  }),
  instagram: !e.INSTAGRAM_ACCESS_TOKEN ? { ok: false, error: "not configured" } : await probe(async () => {
    const { res, body } = await getJson(`https://graph.instagram.com/v25.0/me?fields=id,user_id,username&access_token=${encodeURIComponent(e.INSTAGRAM_ACCESS_TOKEN)}`);
    return res.ok ? { ok: true, username: body.username, idMatches: body.id === e.INSTAGRAM_USER_ID, userIdMatches: String(body.user_id ?? "") === e.INSTAGRAM_USER_ID } : { ok: false, status: res.status, error: scrub(JSON.stringify(body.error ?? body)) };
  }),
  youtube: !(e.YOUTUBE_CLIENT_ID && e.YOUTUBE_CLIENT_SECRET && e.YOUTUBE_REFRESH_TOKEN) ? { ok: false, error: "not configured" } : await probe(async () => {
    const token = await getJson("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: e.YOUTUBE_CLIENT_ID, client_secret: e.YOUTUBE_CLIENT_SECRET, refresh_token: e.YOUTUBE_REFRESH_TOKEN, grant_type: "refresh_token" }) });
    if (!token.res.ok) return { ok: false, stage: "token", status: token.res.status, error: scrub(JSON.stringify(token.body)) };
    const { res, body } = await getJson("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${token.body.access_token}` } });
    return res.ok ? { ok: true, channel: body.items?.[0]?.snippet?.title ?? null, scope: token.body.scope } : { ok: false, stage: "channels", status: res.status, error: scrub(JSON.stringify(body.error ?? body)) };
  }),
  tiktok: e.TIKTOK_ACCESS_TOKEN ? { ok: null, note: "configured; not probed" } : { ok: false, error: "not configured" },
  heygen: !e.HEYGEN_API_KEY ? { ok: false, error: "not configured" } : await probe(async () => {
    const { res, body } = await getJson("https://api.heygen.com/v2/user/remaining_quota", { headers: { "x-api-key": e.HEYGEN_API_KEY } });
    const quota = body?.data?.remaining_quota;
    return res.ok ? { ok: true, remainingQuota: quota, approxCredits: typeof quota === "number" ? Math.floor(quota / 60) : null } : { ok: false, status: res.status, error: scrub(JSON.stringify(body)) };
  }),
};
console.log("[connections]", JSON.stringify(connections));

// Read-only database audit (counts and catalog metadata only, never row contents).
// Answers: does Preview point at a database holding real customers, and which public tables lack RLS?
if (process.env.DATABASE_URL) {
  let database;
  try {
    const { PrismaClient } = await import("@prisma/client");
    const db = new PrismaClient();
    try {
      database = await db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        const tables = await tx.$queryRawUnsafe(`
          SELECT c.relname AS name, c.relrowsecurity AS rls,
                 (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
          FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') ORDER BY c.relname`);
        const grants = await tx.$queryRawUnsafe(`
          SELECT grantee, count(DISTINCT table_name)::int AS tables FROM information_schema.role_table_grants
          WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated') GROUP BY grantee`);
        const [people] = await tx.$queryRawUnsafe(`
          SELECT (SELECT count(*)::int FROM "User") AS users,
                 (SELECT max("createdAt") FROM "User") AS "newestUser",
                 (SELECT count(*)::int FROM "Subscription") AS subscriptions,
                 (SELECT count(*)::int FROM "User" WHERE role = 'ADMIN') AS admins,
                 (SELECT count(*)::int FROM "User" WHERE role = 'ADMIN' AND "emailVerified" IS NOT NULL) AS "adminsVerified"`);
        // Whether the owner's account (OWNER_EMAIL, as in auth.config) exists and is verified: booleans only.
        const ownerEmail = (process.env.OWNER_EMAIL ?? process.env.REPORT_EMAIL ?? "darrenneil2025@gmail.com").trim().toLowerCase();
        const [owner] = await tx.$queryRawUnsafe(`SELECT count(*)::int > 0 AS exists, bool_or("emailVerified" IS NOT NULL) AS verified, bool_or(role = 'ADMIN') AS admin
          FROM "User" WHERE lower(email) = $1`, ownerEmail);
        return {
          ok: true,
          ...people,
          ownerAccount: { exists: owner.exists, verified: !!owner.verified, admin: !!owner.admin },
          tables: tables.length,
          withoutRls: tables.filter((t) => !t.rls).map((t) => t.name),
          rlsWithoutPolicies: tables.filter((t) => t.rls && t.policies === 0).length,
          apiRoleGrants: Object.fromEntries(grants.map((g) => [g.grantee, g.tables])),
        };
      }, { maxWait: 10000, timeout: 30000 });
    } finally {
      await db.$disconnect();
    }
  } catch (err) {
    database = { ok: false, error: String(err instanceof Error ? err.message : err).split(process.env.DATABASE_URL).join("[redacted]").slice(0, 240) };
  }
  const report = { checkedAt: record.checkedAt, commit: record.commit, ...database };
  console.log("[database]", JSON.stringify(report));
}
