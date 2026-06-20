"use client";

import { use, useEffect, useState } from "react";

interface Availability {
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
}

interface Slot { start: Date; end: Date }

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function generateSlots(avail: Availability, existingBookings: { startAt: string; endAt: string }[]): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  const buffer = avail.bufferMins * 60_000;
  const slotMs = avail.slotMins * 60_000;

  for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayKey = DAY_KEYS[date.getDay()];
    const hours = avail[dayKey];
    if (!hours) continue;

    const [startStr, endStr] = hours.split("-");
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);

    const dayStart = new Date(date);
    dayStart.setHours(sh, sm, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(eh, em, 0, 0);

    let cursor = dayStart.getTime();
    while (cursor + slotMs <= dayEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor + slotMs);

      // Check against existing bookings (include buffer)
      const isBooked = existingBookings.some((b) => {
        const bs = new Date(b.startAt).getTime() - buffer;
        const be = new Date(b.endAt).getTime() + buffer;
        return slotStart.getTime() < be && slotEnd.getTime() > bs;
      });

      if (!isBooked) {
        slots.push({ start: slotStart, end: slotEnd });
      }

      cursor += slotMs + buffer;
    }
  }

  return slots;
}

function groupByDate(slots: Slot[]): Record<string, Slot[]> {
  const groups: Record<string, Slot[]> = {};
  for (const s of slots) {
    const key = s.start.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return groups;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function PublicBookingPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [bookings, setBookings] = useState<{ startAt: string; endAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ guestName: "", guestEmail: "", guestPhone: "", title: "Meeting", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/public/book/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setAvailability(data.availability);
        setBookings(data.bookings);
      })
      .catch(() => setError("Could not load availability."))
      .finally(() => setLoading(false));
  }, [userId]);

  const slots = availability ? generateSlots(availability, bookings) : [];
  const grouped = groupByDate(slots);
  const dates = Object.keys(grouped);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/public/book/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startAt: selectedSlot.start.toISOString(),
          endAt: selectedSlot.end.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Booking failed. Please try again."); }
      else { setDone(true); }
    } catch {
      setSubmitError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/20 mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Book an appointment</h1>
          <p className="mt-2 text-sm text-gray-400">Pick a time that works for you.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-500">Loading availability…</div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {done && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-10 text-center">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-white">Booking confirmed!</h2>
            <p className="mt-2 text-sm text-gray-400">
              You&apos;re booked in for{" "}
              <span className="text-white font-semibold">
                {selectedSlot ? `${fmtDate(selectedSlot.start)} at ${fmtTime(selectedSlot.start)}` : ""}
              </span>.
            </p>
            <p className="mt-4 text-xs text-gray-500">Check your email for a confirmation.</p>
          </div>
        )}

        {!loading && !error && !done && (
          <div className="grid gap-6 sm:grid-cols-5">
            {/* Slot picker */}
            <div className="sm:col-span-3 space-y-5">
              {dates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-gray-500 text-sm">
                  No available slots in the next 30 days.
                </div>
              ) : (
                dates.map((dateKey) => (
                  <div key={dateKey}>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                      {fmtDate(grouped[dateKey][0].start)}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {grouped[dateKey].map((slot, i) => {
                        const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-brand-400 bg-brand-500/20 text-brand-300"
                                : "border-white/8 bg-white/3 text-gray-300 hover:border-brand-500/40 hover:bg-brand-500/10"
                            }`}
                          >
                            {fmtTime(slot.start)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Booking form */}
            <div className="sm:col-span-2">
              {selectedSlot ? (
                <form onSubmit={handleSubmit} className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3 sticky top-6">
                  <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2.5 mb-4">
                    <p className="text-xs font-bold text-brand-300">{fmtDate(selectedSlot.start)}</p>
                    <p className="text-sm font-extrabold text-white">
                      {fmtTime(selectedSlot.start)} – {fmtTime(selectedSlot.end)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Your name *</label>
                    <input required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                      className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50"
                      placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email *</label>
                    <input required type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                      className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50"
                      placeholder="jane@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                    <input type="tel" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                      className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50"
                      placeholder="+44 7700 900000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                      className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none resize-none focus:border-brand-500/50"
                      placeholder="What would you like to discuss?" />
                  </div>

                  {submitError && <p className="text-xs text-red-400">{submitError}</p>}

                  <button type="submit" disabled={submitting}
                    className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
                    {submitting ? "Booking…" : "Confirm booking"}
                  </button>

                  <button type="button" onClick={() => setSelectedSlot(null)}
                    className="w-full text-xs text-gray-500 hover:text-gray-400 pt-1">
                    ← Choose a different time
                  </button>
                </form>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/8 p-8 text-center text-gray-500 text-sm">
                  ← Select a time slot
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-600">
          Powered by <span className="text-brand-400">MansaMusaAI</span>
        </p>
      </div>
    </div>
  );
}
