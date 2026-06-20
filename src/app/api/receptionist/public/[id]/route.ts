import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await db.receptionist.findUnique({
    where: { id },
    select: { name: true, greeting: true, widgetColor: true, isActive: true },
  });
  if (!rec || !rec.isActive) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rec);
}
