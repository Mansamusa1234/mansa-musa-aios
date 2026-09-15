import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const ownerPatchSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  body: z.string().min(10).max(10_000).optional(),
}).strict();

const adminPatchSchema = ownerPatchSchema.extend({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  aiResponse: z.string().max(10_000).nullable().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
}).strict();

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ticket = await db.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ ticket });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ticket = await db.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isOwner = ticket.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = isAdmin ? adminPatchSchema.safeParse(body) : ownerPatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid ticket update" }, { status: 400 });
  const resolvedAt = isAdmin && "resolvedAt" in parsed.data
    ? (parsed.data.resolvedAt as string | null | undefined)
    : undefined;
  const data = {
    ...parsed.data,
    ...(resolvedAt !== undefined
      ? { resolvedAt: resolvedAt ? new Date(resolvedAt) : null }
      : {}),
    updatedAt: new Date(),
  };
  const updated = await db.supportTicket.update({ where: { id }, data });
  return NextResponse.json({ ticket: updated });
}
