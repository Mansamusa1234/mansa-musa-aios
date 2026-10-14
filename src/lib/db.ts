import { PrismaClient } from "@prisma/client";
import { isWriteOperation, PreviewReadOnlyError, resolveDatabaseTarget } from "@/lib/previewDbGuard";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const target = resolveDatabaseTarget(process.env);

function databaseUrlWithServerlessLimit(): string | undefined {
  const raw = target.url;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if ((url.protocol === "postgres:" || url.protocol === "postgresql:") && !url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const databaseUrl = databaseUrlWithServerlessLimit();

function createClient(): PrismaClient {
  const client = new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  if (!target.readOnly) return client;
  // Preview without an isolated database: reads work, every write is refused (including inside transactions).
  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        if (isWriteOperation(operation, args)) throw new PreviewReadOnlyError(operation, model);
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
