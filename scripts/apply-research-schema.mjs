import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

// One-time additive change for this repo's db-push-managed database. The build
// never synchronizes unrelated tables or accepts destructive schema changes.
if (process.env.VERCEL_ENV !== "production") {
  console.log("[research schema] Preview/local build: no production database change.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the production research schema update.");
}

const sql = readFileSync(new URL("../prisma/sql/20260927_research_desk.sql", import.meta.url), "utf8");
const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);
const tables = ["Investigation", "ResearchClaim", "ResearchSource", "ClaimSourceLink", "ClaimReviewEvent"];
const db = new PrismaClient();

try {
  await db.$transaction(async (tx) => {
    const existing = await tx.$queryRawUnsafe(`
      SELECT ${tables.map((table, index) => `to_regclass('"${table}"') IS NOT NULL AS "table${index}"`).join(", ")}
    `);
    const present = tables.filter((_, index) => existing[0][`table${index}`]);
    if (present.length === tables.length) {
      console.log("[research schema] Research tables already present.");
      return;
    }
    if (present.length) {
      throw new Error(`Incomplete research schema: ${present.join(", ")}. No changes were made.`);
    }
    for (const statement of statements) {
      await tx.$executeRawUnsafe(statement);
    }
    console.log("[research schema] Five research tables and their indexes created.");
  }, { maxWait: 10000, timeout: 60000 });
} finally {
  await db.$disconnect();
}
