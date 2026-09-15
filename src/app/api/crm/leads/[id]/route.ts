import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(254).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
  value: z.number().int().min(0).max(1_000_000_000).optional(),
  notes: z.string().max(10_000).nullable().optional(),
  assignedTo: z.string().max(200).nullable().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid lead update" }, { status: 400 });
  const updated = await db.lead.update({ where: { id }, data: { ...parsed.data, updatedAt: new Date() } });
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
