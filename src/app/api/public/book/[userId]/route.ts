import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";
import { sendEmail, bookingConfirmedGuestEmailHtml, newBookingOwnerEmailHtml } from "@/lib/email";

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
  const { userId } = await params;

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { startAt, endAt, ...rest } = parsed.data;
  const start = new Date(startAt);
  const end = new Date(endAt);

  // Conflict check
  const conflict = await db.calendarBooking.findFirst({
    where: {
      userId,
      status: { not: "CANCELLED" },
      OR: [
        { startAt: { lt: end }, endAt: { gt: start } },
      ],
    },
  });
  if (conflict) return NextResponse.json({ error: "This time slot is no longer available. Please choose another." }, { status: 409 });

  const booking = await db.calendarBooking.create({
    data: { userId, ...rest, startAt: start, endAt: end },
  });

  const fmtDt = (d: Date) => d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Fire-and-forget confirmation emails
  void Promise.all([
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
  ]).catch(() => {});

  return NextResponse.json({ booking }, { status: 201 });
}
