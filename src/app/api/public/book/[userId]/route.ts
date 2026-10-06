import { db } from "@/lib/db";
import { z } from "zod";
import { after, NextResponse } from "next/server";
import { sendEmail, bookingConfirmedGuestEmailHtml, newBookingOwnerEmailHtml } from "@/lib/email";
import { triggerWorkflows } from "@/lib/email-automation";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";

const schema = z.object({
  guestName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(30).optional(),
  title: z.string().min(1).max(200).default("Meeting"),
  notes: z.string().max(1000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const avail = await db.calendarAvailability.findUnique({ where: { userId } });
  if (!avail) return NextResponse.json({ error: "No availability configured" }, { status: 404 });

  // Return existing bookings for the next 30 days so the client can show free slots
  const bookings = await db.calendarBooking.findMany({
    where: {
      userId,
      startAt: { gte: new Date() },
      endAt: { lte: new Date(Date.now() + 30 * 86_400_000) },
      status: { not: "CANCELLED" },
    },
    select: { startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({ availability: avail, bookings });
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const limited = await checkRateLimit(limiters.publicWrite, getIP(req));
  if (limited) return limited;

  const { userId } = await params;

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { startAt, endAt, ...rest } = parsed.data;
  const start = new Date(startAt);
  const end = new Date(endAt);
  const durationMs = end.getTime() - start.getTime();
  if (start.getTime() < Date.now() || durationMs < 5 * 60_000 || durationMs > 8 * 60 * 60_000) {
    return NextResponse.json({ error: "Booking time or duration is invalid." }, { status: 400 });
  }
  if (start.getTime() > Date.now() + 366 * 86_400_000) {
    return NextResponse.json({ error: "Bookings cannot be made more than one year ahead." }, { status: 400 });
  }

  const availability = await db.calendarAvailability.findUnique({ where: { userId } });
  if (!availability) return NextResponse.json({ error: "No availability configured" }, { status: 404 });
  if (!withinBusinessHours(start, end, availability)) {
    return NextResponse.json({ error: "Choose an available appointment within this business's opening hours." }, { status: 400 });
  }

  // Respect the buffer on both sides of existing appointments.
  const bufferMs = Math.max(0, availability.bufferMins) * 60_000;
  // Conflict check
  const conflict = await db.calendarBooking.findFirst({
    where: {
      userId,
      status: { not: "CANCELLED" },
      OR: [
        { startAt: { lt: new Date(end.getTime() + bufferMs) }, endAt: { gt: new Date(start.getTime() - bufferMs) } },
      ],
    },
  });
  if (conflict) return NextResponse.json({ error: "This time slot is no longer available. Please choose another." }, { status: 409 });

  const booking = await db.calendarBooking.create({
    data: { userId, ...rest, startAt: start, endAt: end },
  });

  const fmtDt = (d: Date) => d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: availability.timezone });

  // Keep notifications alive after the serverless response has completed.
  after(async () => {
    const results = await Promise.allSettled([
      triggerWorkflows(userId, "BOOKING_CONFIRMED", { email: rest.guestEmail, name: rest.guestName }),
    sendEmail(
      rest.guestEmail,
      `Booking confirmed: ${rest.title}`,
      bookingConfirmedGuestEmailHtml({
        guestName: rest.guestName,
        startAt: fmtDt(start),
        endAt: fmtDt(end),
        title: rest.title,
        notes: rest.notes,
      })
    ),
    sendEmail(
      user.email,
      `New booking: ${rest.guestName}`,
      newBookingOwnerEmailHtml({
        guestName: rest.guestName,
        guestEmail: rest.guestEmail,
        guestPhone: rest.guestPhone,
        startAt: fmtDt(start),
        title: rest.title,
        notes: rest.notes,
      })
    ),
    ]);
    for (const result of results) {
      if (result.status === "rejected") console.error("[booking] Notification failed", result.reason);
    }
  });

  return NextResponse.json({ booking }, { status: 201 });
}

type BusinessAvailability = {
  timezone: string;
  slotMins: number;
  bufferMins: number;
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
};

function withinBusinessHours(start: Date, end: Date, availability: BusinessAvailability): boolean {
  try {
    if (!Number.isInteger(availability.slotMins) || availability.slotMins < 5 || availability.slotMins > 480 ||
        !Number.isInteger(availability.bufferMins) || availability.bufferMins < 0) return false;
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: availability.timezone,
      year: "numeric", month: "2-digit", day: "2-digit", weekday: "long",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    const local = (date: Date) => Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
    const first = local(start);
    const last = local(end);
    if (["year", "month", "day"].some((key) => first[key] !== last[key])) return false;
    const dayKey = first.weekday.toLowerCase() as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    const hours = availability[dayKey];
    const match = hours?.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
    if (!match) return false;
    const [, sh, sm, eh, em] = match.map(Number);
    if (sh > 23 || eh > 23 || sm > 59 || em > 59) return false;
    const opening = sh * 60 + sm;
    const closing = eh * 60 + em;
    const from = Number(first.hour) * 60 + Number(first.minute);
    const to = Number(last.hour) * 60 + Number(last.minute);
    return closing > opening && from >= opening && to <= closing && to > from &&
      first.second === "00" && last.second === "00" && start.getMilliseconds() === 0 && end.getMilliseconds() === 0 &&
      end.getTime() - start.getTime() === availability.slotMins * 60_000 &&
      (from - opening) % (availability.slotMins + availability.bufferMins) === 0;
  } catch {
    // Invalid timezone or malformed saved hours must never create an out-of-hours booking.
    return false;
  }
}
