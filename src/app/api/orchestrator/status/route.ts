import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orchestratorStatus } from "@/lib/orchestrator/status";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pendingApprovals = await db.contentQueue.count({
    where: { status: "PENDING" },
  });

  return NextResponse.json({
    ok: true,
    ...orchestratorStatus(),
    pendingApprovals,
  });
}
