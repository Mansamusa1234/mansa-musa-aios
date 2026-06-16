import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const target = await db.trustedSession.findUnique({ where: { id } });
  if (!target || target.userId !== session.user.id) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  await db.trustedSession.update({ where: { id }, data: { revokedAt: new Date() } });
  await logAuditEvent({ userId: session.user.id, event: "SESSION_REVOKED", metadata: { sessionId: id } });

  return NextResponse.json({ success: true });
}
