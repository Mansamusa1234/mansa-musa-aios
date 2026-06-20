import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["NOTE", "EMAIL", "CALL", "MEETING", "TASK"]).default("NOTE"),
  note: z.string().min(1).max(2000),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const activities = await db.leadActivity.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ activities });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead || lead.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

  const activity = await db.leadActivity.create({
    data: { leadId: id, type: parsed.data.type, note: parsed.data.note },
  });

  // Update lead updatedAt
  await db.lead.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ activity }, { status: 201 });
}
