import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import CalendarContent from "./CalendarContent";

export const metadata: Metadata = {
  title: "Calendar & Booking | MansaMusaAI",
  description: "Manage bookings, availability, and appointments.",
};

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user.id;
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 86400000);

  const [bookings, availability] = await Promise.all([
    db.calendarBooking.findMany({ where: { userId, startAt: { gte: now, lte: end } }, orderBy: { startAt: "asc" } }),
    db.calendarAvailability.findUnique({ where: { userId } }),
  ]);

  return (
    <CalendarContent
      bookings={bookings.map((b) => ({ id: b.id, guestName: b.guestName, guestEmail: b.guestEmail, guestPhone: b.guestPhone, title: b.title, notes: b.notes, startAt: b.startAt, endAt: b.endAt, status: b.status }))}
      availability={availability ?? { timezone: "Europe/London", slotMins: 30, bufferMins: 15, monday: "09:00-17:00", tuesday: "09:00-17:00", wednesday: "09:00-17:00", thursday: "09:00-17:00", friday: "09:00-17:00", saturday: null, sunday: null }}
      userId={userId}
    />
  );
}
