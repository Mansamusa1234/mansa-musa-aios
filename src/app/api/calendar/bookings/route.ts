import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  title: z.string().min(1),
  notes: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date();
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date(Date.now() + 30 * 86400000);
  const bookings = await db.calendarBooking.findMany({
    where: { userId: session.user.id, startAt: { gte: from, lte: to } },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const booking = await db.calendarBooking.create({
    data: { userId: session.user.id, ...parsed.data, startAt: new Date(parsed.data.startAt), endAt: new Date(parsed.data.endAt) },
  });
  return NextResponse.json({ booking }, { status: 201 });
}
