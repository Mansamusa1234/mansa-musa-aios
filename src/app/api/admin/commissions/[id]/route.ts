import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

const TRANSITIONS: Record<string, { from: string; to: string }> = {
  approve: { from: "PENDING", to: "APPROVED" },
  reject: { from: "PENDING", to: "REJECTED" },
  "mark-paid": { from: "APPROVED", to: "PAID" },
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;

  const { id } = await params;
  const { action } = await req.json();
  const transition = TRANSITIONS[action];
  if (!transition) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const entry = await db.commissionLedger.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (entry.status !== transition.from) {
    return NextResponse.json({ error: `Cannot ${action} a ${entry.status} entry` }, { status: 409 });
  }

  const now = new Date();
  const data =
    action === "mark-paid"
      ? { status: "PAID" as const, paidAt: now, paidByUserId: session.user.id }
      : { status: transition.to as "APPROVED" | "REJECTED", approvedAt: now, approvedByUserId: session.user.id };

  const updated = await db.commissionLedger.update({ where: { id }, data });
  return NextResponse.json({ success: true, status: updated.status });
}
