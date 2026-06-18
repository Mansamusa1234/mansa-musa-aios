"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

interface Booking { id: string; guestName: string; guestEmail: string; guestPhone: string | null; title: string; notes: string | null; startAt: Date; endAt: Date; status: string }
interface Availability { timezone: string; slotMins: number; bufferMins: number; monday: string | null; tuesday: string | null; wednesday: string | null; thursday: string | null; friday: string | null; saturday: string | null; sunday: string | null }

interface Props { bookings: Booking[]; availability: Availability }

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Day = typeof DAYS[number];

function fmt(d: Date) { return new Date(d).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }

export default function CalendarContent({ bookings: initialBookings, availability: initialAvail }: Props) {
  const [bookings, setBookings] = useState(initialBookings);
  const [avail, setAvail] = useState(initialAvail);
  const [tab, setTab] = useState<"bookings" | "availability" | "new">("bookings");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ guestName: "", guestEmail: "", guestPhone: "", title: "Meeting", notes: "", startAt: "", endAt: "" });

  async function saveAvailability() {
    setSaving(true);
    await fetch("/api/calendar/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(avail) });
    setSaving(false);
  }

  async function addBooking(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/calendar/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString() }) });
    const data = await res.json();
    if (res.ok) { setBookings((p) => [...p, data.booking]); setTab("bookings"); setForm({ guestName: "", guestEmail: "", guestPhone: "", title: "Meeting", notes: "", startAt: "", endAt: "" }); }
    setSaving(false);
  }

  async function cancelBooking(id: string) {
    await fetch(`/api/calendar/bookings/${id}`, { method: "DELETE" });
    setBookings((p) => p.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
  }

  const STATUS_COLORS: Record<string, string> = { CONFIRMED: "text-green-400", CANCELLED: "text-red-400", PENDING: "text-amber-400" };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
      <motion.div variants={fadeUp}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Calendar ·</p>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Bookings & Availability</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your schedule and let guests book time with you.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-1 rounded-xl border border-white/8 bg-white/3 p-1 w-fit">
        {(["bookings", "availability", "new"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-brand-500 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {t === "new" ? "+ New booking" : t}
          </button>
        ))}
      </motion.div>

      {tab === "bookings" && (
        <motion.div variants={fadeUp} className="space-y-3">
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-3xl mb-3">📅</p>
              <p className="text-gray-400 font-medium">No upcoming bookings</p>
              <p className="text-sm text-gray-400 mt-1">Add a booking or share your availability link.</p>
            </div>
          ) : bookings.map((b) => (
            <div key={b.id} className="rounded-2xl border border-white/8 bg-white/3 p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white">{b.title}</p>
                  <span className={`text-[10px] font-bold ${STATUS_COLORS[b.status] ?? "text-gray-400"}`}>{b.status}</span>
                </div>
                <p className="text-xs text-gray-400">{b.guestName} · {b.guestEmail}</p>
                <p className="text-xs text-gray-400 mt-1">{fmt(b.startAt)} → {fmt(b.endAt)}</p>
                {b.notes && <p className="text-xs text-gray-400 mt-1 italic">"{b.notes}"</p>}
              </div>
              {b.status === "CONFIRMED" && (
                <button onClick={() => cancelBooking(b.id)} className="flex-shrink-0 rounded-lg border border-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10">Cancel</button>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {tab === "availability" && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Timezone</label>
              <input value={avail.timezone} onChange={(e) => setAvail({ ...avail, timezone: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Slot duration (mins)</label>
              <input type="number" value={avail.slotMins} onChange={(e) => setAvail({ ...avail, slotMins: parseInt(e.target.value) })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Buffer (mins)</label>
              <input type="number" value={avail.bufferMins} onChange={(e) => setAvail({ ...avail, bufferMins: parseInt(e.target.value) })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 mb-2">Working hours (format: 09:00-17:00 or leave blank for off)</p>
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 text-xs capitalize text-gray-500">{day}</span>
                <input
                  value={(avail[day as Day] as string | null) ?? ""}
                  onChange={(e) => setAvail({ ...avail, [day]: e.target.value || null })}
                  placeholder="09:00-17:00"
                  className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50"
                />
              </div>
            ))}
          </div>
          <button onClick={saveAvailability} disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
            {saving ? "Saving..." : "Save availability"}
          </button>
        </motion.div>
      )}

      {tab === "new" && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <form onSubmit={addBooking} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Guest name *</label>
                <input required value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Guest email *</label>
                <input required type="email" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Guest phone</label>
                <input value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Meeting title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Start time *</label>
                <input required type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">End time *</label>
                <input required type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-white outline-none resize-none" />
            </div>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
              {saving ? "Creating..." : "Create booking"}
            </button>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
}
