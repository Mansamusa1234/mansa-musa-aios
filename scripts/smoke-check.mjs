// Read-only post-deploy smoke check (no sign-in, no writes). Usage: node scripts/smoke-check.mjs https://www.mansamusainitiative.com
// Exit code 1 if any critical check fails, so it can gate a rollback decision.
const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) { console.error("Usage: node scripts/smoke-check.mjs <base-url>"); process.exit(2); }

const get = (path) => fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(20000) });
const checks = [
  ["home page", "/", (r) => r.status === 200],
  ["pricing page", "/pricing", (r) => r.status === 200],
  ["login page", "/login", (r) => r.status === 200],
  ["register page", "/register", (r) => r.status === 200],
  ["health: database reachable", "/api/health", async (r) => r.status === 200 && ["ok", "degraded"].includes((await r.json()).status)],
  ["dashboard requires sign-in", "/dashboard", (r) => [302, 303, 307, 308].includes(r.status) && /\/login/.test(r.headers.get("location") ?? "")],
  ["admin requires sign-in", "/admin/approval-queue", (r) => [302, 303, 307, 308].includes(r.status)],
  ["cron refuses calls without the secret", "/api/cron/social-post", (r) => r.status === 401],
  ["no public diagnostics", "/_diagnostics/database.json", (r) => r.status === 404],
  ["security headers", "/", (r) => !!r.headers.get("strict-transport-security") && !!r.headers.get("content-security-policy") && r.headers.get("x-content-type-options") === "nosniff"],
];

let failed = 0;
for (const [name, path, test] of checks) {
  let ok = false; let note = "";
  try { const r = await get(path); note = String(r.status); ok = await test(r); } catch (err) { note = String(err?.message ?? err); }
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} (${path}) ${note}`);
}
console.log(failed ? `${failed} check(s) failed` : "All smoke checks passed");
process.exit(failed ? 1 : 0);
