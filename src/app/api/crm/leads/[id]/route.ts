import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = await db.lead.update({ where: { id }, data: { ...body, updatedAt: new Date() } });
  return NextResponse.json({ lead: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
