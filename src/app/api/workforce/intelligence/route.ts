import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Get today's reports, fall back to yesterday if today not yet generated
  let reports = await db.agentIntelligenceReport.findMany({
    where: { date: today },
    orderBy: { agentRole: "asc" },
  });

  if (reports.length === 0) {
    reports = await db.agentIntelligenceReport.findMany({
      where: { date: yesterday },
      orderBy: { agentRole: "asc" },
    });
  }

  return NextResponse.json({ reports, date: reports[0]?.date ?? today });
}
