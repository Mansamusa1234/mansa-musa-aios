// Keeps Vercel Preview deployments from writing to the production database.
// Preview uses PREVIEW_DATABASE_URL when set (an isolated database, e.g. a Supabase branch). Without it,
// Preview falls back to DATABASE_URL in read-only mode: every write is rejected before it reaches Postgres.

export type DatabaseTarget = { url: string | undefined; readOnly: boolean; source: "DATABASE_URL" | "PREVIEW_DATABASE_URL" };

export function resolveDatabaseTarget(env: Record<string, string | undefined>): DatabaseTarget {
  if (env.VERCEL_ENV === "preview") {
    const isolated = env.PREVIEW_DATABASE_URL?.trim();
    if (isolated && isolated !== env.DATABASE_URL?.trim()) return { url: isolated, readOnly: false, source: "PREVIEW_DATABASE_URL" };
    return { url: env.DATABASE_URL, readOnly: true, source: "DATABASE_URL" };
  }
  return { url: env.DATABASE_URL, readOnly: false, source: "DATABASE_URL" };
}

const WRITE_OPERATIONS = new Set([
  "create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn", "upsert", "delete", "deleteMany",
  "$executeRaw", "$executeRawUnsafe", "$runCommandRaw",
]);
const READ_ONLY_SQL = /^\s*(select|show|explain)\b/i;
const WRITE_SQL = /\b(insert|update|delete|merge|upsert|alter|drop|create|truncate|grant|revoke|copy|call|do|set|lock|vacuum|refresh|nextval|setval)\b/i;

function rawSql(args: unknown): string | null {
  if (Array.isArray(args) && typeof args[0] === "string") return args[0];
  const strings = (args as { strings?: unknown })?.strings;
  if (Array.isArray(strings) && strings.every((s) => typeof s === "string")) return strings.join(" ");
  return null;
}

/** True when an operation could change data. Unrecognised raw queries count as writes. */
export function isWriteOperation(operation: string, args: unknown): boolean {
  if (WRITE_OPERATIONS.has(operation)) return true;
  if (operation === "$queryRaw" || operation === "$queryRawUnsafe") {
    const sql = rawSql(args);
    return !sql || !READ_ONLY_SQL.test(sql) || WRITE_SQL.test(sql);
  }
  return false;
}

export class PreviewReadOnlyError extends Error {
  constructor(operation: string, model?: string) {
    super(`Preview is read-only against the production database (blocked ${model ? `${model}.` : ""}${operation}). Set PREVIEW_DATABASE_URL to an isolated database to test writes.`);
    this.name = "PreviewReadOnlyError";
  }
}
