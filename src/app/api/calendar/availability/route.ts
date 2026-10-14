import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFeature } from "@/lib/accountGuards";

const DEFAULTS = { timezone: "Europe/London", slotMins: 30, bufferMins: 15, monday: "09:00-17:00", tuesday: "09:00-17:00", wednesday: "09:00-17:00", thursday: "09:00-17:00", friday: "09:00-17:00", saturday: null, sunday: null };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const avail = await db.calendarAvailability.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ availability: avail ?? { ...DEFAULTS, userId: session.user.id } });
}

// Only these fields are writable; the owner is always the signed-in user (never taken from the body).
const day = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/).nullable().optional();
const availabilitySchema = z.object({
  timezone: z.string().min(1).max(64).optional(),
  slotMins: z.number().int().min(5).max(480).optional(),
  bufferMins: z.number().int().min(0).max(240).optional(),
  monday: day, tuesday: day, wednesday: day, thursday: day, friday: day, saturday: day, sunday: day,
}); // unknown keys (id, userId, ...) are dropped

export async function POST(req: Request) {
  const planGate = await requireFeature("bookings");
  if (planGate) return planGate;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = availabilitySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid availability settings." }, { status: 400 });
  const body = parsed.data;
  const avail = await db.calendarAvailability.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...body },
    update: body,
  });
  return NextResponse.json({ availability: avail });
}
