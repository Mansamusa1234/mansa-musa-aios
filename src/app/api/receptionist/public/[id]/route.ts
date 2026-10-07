import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getActivePlan, hasFeature } from "@/lib/subscription";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await db.receptionist.findUnique({
    where: { id },
    select: { userId: true, name: true, greeting: true, widgetColor: true, isActive: true },
  });
  if (!rec || !rec.isActive) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!hasFeature(await getActivePlan(rec.userId), "receptionist")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ name: rec.name, greeting: rec.greeting, widgetColor: rec.widgetColor, isActive: rec.isActive });
}
