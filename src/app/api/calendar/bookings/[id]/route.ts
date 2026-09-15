import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  guestName: z.string().min(1).max(100).optional(),
  guestEmail: z.string().email().max(254).optional(),
  guestPhone: z.string().max(30).nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(1000).nullable().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const booking = await db.calendarBooking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid booking update" }, { status: 400 });
  const { startAt: startRaw, endAt: endRaw, ...rest } = parsed.data;
  const data = {
    ...rest,
    ...(startRaw ? { startAt: new Date(startRaw) } : {}),
    ...(endRaw ? { endAt: new Date(endRaw) } : {}),
  };
  const start = startRaw ? new Date(startRaw) : booking.startAt;
  const end = endRaw ? new Date(endRaw) : booking.endAt;
  if (end <= start || end.getTime() - start.getTime() > 8 * 60 * 60_000) {
    return NextResponse.json({ error: "Invalid booking time range" }, { status: 400 });
  }
  const updated = await db.calendarBooking.update({ where: { id }, data });
  return NextResponse.json({ booking: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const booking = await db.calendarBooking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.calendarBooking.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ success: true });
}
