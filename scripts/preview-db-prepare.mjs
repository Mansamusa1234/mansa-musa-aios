// Preview builds only: bring the isolated Preview database (PREVIEW_DATABASE_URL) up to the Prisma schema
// so Preview can be used for real signup / Stripe test-mode journeys without touching customer data.
// Never runs against DATABASE_URL, never accepts data loss, and is a no-op without PREVIEW_DATABASE_URL.
import { spawnSync } from "node:child_process";

const preview = process.env.PREVIEW_DATABASE_URL?.trim();
if (process.env.VERCEL_ENV !== "preview" || !preview) {
  console.log("[preview-db] skipped (Preview build with PREVIEW_DATABASE_URL only)");
  process.exit(0);
}
if (preview === process.env.DATABASE_URL?.trim()) {
  console.error("[preview-db] PREVIEW_DATABASE_URL equals DATABASE_URL; refusing to touch it (Preview stays read-only).");
  process.exit(0);
}
let host = "unknown";
try { host = new URL(preview).hostname; } catch { /* reported below */ }
const result = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
  env: { ...process.env, DATABASE_URL: preview },
  encoding: "utf8",
});
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.split(preview).join("[redacted]");
console.log(`[preview-db] schema push to isolated database on ${host}: ${result.status === 0 ? "ok" : `failed (exit ${result.status})`}`);
if (result.status !== 0) console.log(output.slice(-1500));
