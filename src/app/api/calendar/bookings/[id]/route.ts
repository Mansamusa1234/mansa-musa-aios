import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const booking = await db.calendarBooking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = await db.calendarBooking.update({ where: { id }, data: body });
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
