"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  role: string;
  _count: { conversations: number };
}

interface Props {
  members: Member[];
  currentUserId: string;
  currentRole: string;
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-brand-500/20 text-brand-300 border-brand-500/30",
  USER:  "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function initials(name: string | null, email: string | null): string {
  if (name) return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

function avatarColor(id: string): string {
  const colors = [
    "bg-brand-500/30", "bg-blue-500/30", "bg-green-500/30",
    "bg-purple-500/30", "bg-amber-500/30", "bg-teal-500/30",
  ];
  return colors[id.charCodeAt(0) % colors.length];
}

function timeAgo(date: Date): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function TeamContent({ members: initial, currentUserId, currentRole }: Props) {
  const [members, setMembers] = useState(initial);
  const [managing, setManaging] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const admins = members.filter((m) => m.role === "ADMIN");
  const users  = members.filter((m) => m.role !== "ADMIN");
  const totalConversations = members.reduce((s, m) => s + m._count.conversations, 0);

  async function changeRole(id: string, role: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m));
      setManaging((prev) => prev?.id === id ? { ...prev, role } : prev);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to update role");
    }
    setBusy(false);
  }

  async function deleteUser(id: string) {
    if (!confirm("Permanently delete this user and all their data?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setManaging(null);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to delete user");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Workspace ·</p>
          <h1 className="text-2xl font-extrabold text-white">Team Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            {members.length} members across your workspace
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total members",       value: members.length,       color: "text-brand-400"  },
            { label: "Admins",              value: admins.length,        color: "text-purple-400" },
            { label: "Active users",        value: users.length,         color: "text-blue-400"   },
            { label: "Total conversations", value: totalConversations,   color: "text-green-400"  },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className={`text-2xl font-extrabold ${s.color}`}><CountUp value={s.value} duration={1000} /></p>
              <p className="mt-1 text-xs text-gray-600">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Members table */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3">All Members</h2>
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <div className="grid grid-cols-12 border-b border-white/6 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
            <span className="col-span-5">Member</span>
            <span className="col-span-2 hidden sm:block">Role</span>
            <span className="col-span-2 hidden md:block">Conversations</span>
            <span className="col-span-2 hidden lg:block">Joined</span>
            <span className="col-span-3 sm:col-span-1"></span>
          </div>

          {members.map((member, i) => {
            const isMe = member.id === currentUserId;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`grid grid-cols-12 items-center border-b border-white/4 px-5 py-3 last:border-0 hover:bg-white/2 transition-colors ${isMe ? "bg-brand-500/5" : ""}`}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${avatarColor(member.id)} text-sm font-bold text-white`}>
                    {initials(member.name, member.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{member.name ?? "Unknown"}</p>
                      {isMe && <span className="flex-shrink-0 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-400">You</span>}
                    </div>
                    <p className="text-[11px] text-gray-600 truncate">{member.email}</p>
                  </div>
                </div>

                <div className="col-span-2 hidden sm:flex">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_STYLES[member.role] ?? ROLE_STYLES.USER}`}>
                    {member.role}
                  </span>
                </div>

                <div className="col-span-2 hidden md:block">
                  <p className="text-sm text-gray-400">{member._count.conversations}</p>
                </div>

                <div className="col-span-2 hidden lg:block">
                  <p className="text-xs text-gray-600">{timeAgo(member.createdAt)}</p>
                </div>

                <div className="col-span-7 sm:col-span-1 flex justify-end">
                  {currentRole === "ADMIN" && !isMe && (
                    <button
                      onClick={() => { setManaging(member); setError(null); }}
                      className="rounded-lg border border-white/8 bg-white/3 px-2 py-1 text-[10px] text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {members.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-600">No team members found</div>
          )}
        </div>
      </div>

      {/* Manage user modal */}
      <AnimatePresence>
        {managing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={(e) => { if (e.target === e.currentTarget) setManaging(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#0e0e1a] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${avatarColor(managing.id)} text-sm font-bold text-white`}>
                  {initials(managing.name, managing.email)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{managing.name ?? "Unknown"}</p>
                  <p className="text-xs text-gray-400">{managing.email}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 mb-2">Role</p>
                <div className="flex gap-2">
                  {["USER", "ADMIN"].map((r) => (
                    <button
                      key={r}
                      disabled={busy || managing.role === r}
                      onClick={() => changeRole(managing.id, r)}
                      className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${managing.role === r ? "border-brand-500/40 bg-brand-500/10 text-brand-300" : "border-white/8 text-gray-400 hover:text-white hover:border-white/20"} disabled:opacity-40`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                disabled={busy}
                onClick={() => deleteUser(managing.id)}
                className="w-full rounded-xl border border-red-500/20 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                {busy ? "Working…" : "Delete user"}
              </button>

              <button onClick={() => setManaging(null)} className="w-full text-xs text-gray-500 hover:text-gray-300">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite placeholder */}
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <div className="mb-3 text-3xl">👥</div>
        <h3 className="text-sm font-bold text-white mb-1">Invite team members</h3>
        <p className="text-xs text-gray-600 mb-4">Share your workspace to collaborate with colleagues</p>
        <div className="flex gap-2 max-w-sm mx-auto">
          <input disabled placeholder="colleague@company.com" className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-gray-500 placeholder-gray-700 cursor-not-allowed" />
          <button disabled className="rounded-xl bg-brand-500/30 px-4 py-2 text-sm font-semibold text-brand-400 cursor-not-allowed">Invite</button>
        </div>
        <p className="mt-2 text-[10px] text-gray-700">Invites coming in a future release</p>
      </div>
    </div>
  );
}
