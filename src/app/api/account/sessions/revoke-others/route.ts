import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentJti = (session as unknown as { jti?: string }).jti;

  const result = await db.trustedSession.updateMany({
    where: {
      userId: session.user.id,
      revokedAt: null,
      ...(currentJti ? { tokenId: { not: currentJti } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  await logAuditEvent({ userId: session.user.id, event: "SESSION_REVOKED", metadata: { revokedCount: result.count, reason: "revoke_all_others" } });

  return NextResponse.json({ success: true, revokedCount: result.count });
}
