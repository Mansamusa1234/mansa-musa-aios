import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const DEFAULTS = { timezone: "Europe/London", slotMins: 30, bufferMins: 15, monday: "09:00-17:00", tuesday: "09:00-17:00", wednesday: "09:00-17:00", thursday: "09:00-17:00", friday: "09:00-17:00", saturday: null, sunday: null };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const avail = await db.calendarAvailability.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ availability: avail ?? { ...DEFAULTS, userId: session.user.id } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const avail = await db.calendarAvailability.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...body },
    update: body,
  });
  return NextResponse.json({ availability: avail });
}
