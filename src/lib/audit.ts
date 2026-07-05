import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AuditEvent =
  | "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "LOGOUT" | "ACCOUNT_LOCKED" | "SUSPICIOUS_LOGIN"
  | "PASSWORD_RESET_REQUESTED" | "PASSWORD_RESET_COMPLETED" | "PASSWORD_CHANGED"
  | "EMAIL_VERIFICATION_SENT" | "EMAIL_VERIFIED" | "EMAIL_CHANGED" | "SESSION_REVOKED";

/** Best-effort audit log write. Never throws -- a logging failure must never block the underlying action. */
export async function logAuditEvent(params: {
  userId?: string | null;
  event: AuditEvent;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        event: params.event as Prisma.AuditLogCreateInput["event"],
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata as import("@prisma/client").Prisma.InputJsonValue ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] log write failed:", err);
  }
}
