"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

interface TeamUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface Member {
  id: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  user: TeamUser;
}

interface Invite {
  id: string;
  email: string;
  role: TeamRole;
  createdAt: Date;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  plan: string;
  members: Member[];
  invites: Invite[];
}

interface Props {
  teams: Team[];
  currentUserId: string;
}

const ROLE_COLORS: Record<TeamRole, string> = {
  OWNER:  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  ADMIN:  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  MEMBER: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  VIEWER: "bg-gray-500/10 text-gray-500 border-gray-500/15",
};

function initials(u: TeamUser) {
  if (u.name) return u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (u.email) return u.email[0].toUpperCase();
  return "?";
}

function avatarBg(id: string) {
  const colors = ["bg-indigo-500/30", "bg-blue-500/30", "bg-green-500/30", "bg-purple-500/30", "bg-amber-500/30", "bg-teal-500/30"];
  return colors[id.charCodeAt(0) % colors.length];
}

export default function TeamContent({ teams: initial, currentUserId }: Props) {
  const [teams, setTeams] = useState<Team[]>(initial);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(initial[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? null;
  const currentMembership = activeTeam?.members.find((m) => m.userId === currentUserId);
  const canManage = currentMembership?.role === "OWNER" || currentMembership?.role === "ADMIN";
  const isOwner = currentMembership?.role === "OWNER";

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function createTeam() {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json() as { team?: Team; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to create team"); return; }
      setTeams((prev) => [...prev, data.team!]);
      setActiveTeamId(data.team!.id);
      setNewName("");
      setCreating(false);
      flash("Team created!");
    } finally { setBusy(false); }
  }

  async function sendInvite() {
    if (!inviteEmail.trim() || !activeTeam) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: activeTeam.id, email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json() as { invite?: Invite; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to send invite"); return; }
      setTeams((prev) => prev.map((t) =>
        t.id === activeTeam.id ? { ...t, invites: [...t.invites, data.invite!] } : t
      ));
      setInviteEmail("");
      flash("Invite sent!");
    } finally { setInviting(false); }
  }

  async function removeInvite(inviteId: string) {
    if (!activeTeam) return;
    const res = await fetch("/api/team/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId, teamId: activeTeam.id }),
    });
    if (res.ok) {
      setTeams((prev) => prev.map((t) =>
        t.id === activeTeam.id ? { ...t, invites: t.invites.filter((i) => i.id !== inviteId) } : t
      ));
    }
  }

  async function removeMember(memberId: string) {
    if (!activeTeam) return;
    const res = await fetch("/api/team/member", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, teamId: activeTeam.id }),
    });
    if (res.ok) {
      setTeams((prev) => prev.map((t) =>
        t.id === activeTeam.id ? { ...t, members: t.members.filter((m) => m.id !== memberId) } : t
      ));
    }
  }

  async function changeRole(memberId: string, role: TeamRole) {
    if (!activeTeam) return;
    const res = await fetch("/api/team/member", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, teamId: activeTeam.id, role }),
    });
    if (res.ok) {
      setTeams((prev) => prev.map((t) =>
        t.id === activeTeam.id ? { ...t, members: t.members.map((m) => m.id === memberId ? { ...m, role } : m) } : t
      ));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">· Enterprise ·</p>
          <h1 className="text-2xl font-extrabold text-white">Teams</h1>
          <p className="mt-1 text-sm text-gray-500">Create teams, invite members, and manage roles.</p>
        </div>
        <button
          onClick={() => { setCreating(true); setError(null); }}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          + New Team
        </button>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            ✓ {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create team modal */}
      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setCreating(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#0e0e1a] p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Create a team</h2>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTeam()}
                placeholder="Team name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setCreating(false)} className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={createTeam} disabled={busy || !newName.trim()}
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 py-2.5 text-sm font-semibold text-white transition-colors">
                  {busy ? "Creating…" : "Create"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {teams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-lg font-bold text-white mb-2">No teams yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create a team to collaborate with colleagues and manage shared resources.</p>
          <button onClick={() => setCreating(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors">
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Team list sidebar */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">Your Teams</h2>
            {teams.map((team) => {
              const myRole = team.members.find((m) => m.userId === currentUserId)?.role;
              return (
                <button key={team.id} onClick={() => setActiveTeamId(team.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    activeTeamId === team.id
                      ? "border-indigo-500/50 bg-indigo-500/10"
                      : "border-white/8 bg-white/2 hover:bg-white/4"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-lg font-bold text-indigo-300">
                      {(team.name?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{team.name}</div>
                      <div className="text-[10px] text-gray-500">{team.members.length} member{team.members.length !== 1 ? "s" : ""}</div>
                    </div>
                    {myRole && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${ROLE_COLORS[myRole]}`}>
                        {myRole}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active team detail */}
          {activeTeam && (
            <div className="lg:col-span-2 space-y-4">
              {/* Team header */}
              <div className="rounded-xl border border-white/8 bg-white/2 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl font-bold text-indigo-300">
                    {(activeTeam.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">{activeTeam.name}</h2>
                    <p className="text-xs text-gray-500">slug: {activeTeam.slug} · {activeTeam.plan} plan</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold capitalize">
                    {activeTeam.plan}
                  </span>
                </div>
              </div>

              {/* Members */}
              <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <h3 className="text-sm font-bold text-white">Members ({activeTeam.members.length})</h3>
                </div>
                <div className="divide-y divide-white/4">
                  {activeTeam.members.map((member) => {
                    const isMe = member.userId === currentUserId;
                    return (
                      <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBg(member.userId)}`}>
                          {initials(member.user)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white truncate">{member.user.name ?? "Unknown"}</span>
                            {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">You</span>}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{member.user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {canManage && !isMe && member.role !== "OWNER" ? (
                            <select
                              value={member.role}
                              onChange={(e) => changeRole(member.id, e.target.value as TeamRole)}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 focus:outline-none"
                            >
                              {(["ADMIN", "MEMBER", "VIEWER"] as TeamRole[]).map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${ROLE_COLORS[member.role]}`}>
                              {member.role}
                            </span>
                          )}
                          {(canManage && !isMe && member.role !== "OWNER") || (isMe && member.role !== "OWNER") ? (
                            <button onClick={() => removeMember(member.id)}
                              className="text-gray-600 hover:text-red-400 transition-colors text-xs">
                              {isMe ? "Leave" : "×"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pending invites */}
              {activeTeam.invites.length > 0 && (
                <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8">
                    <h3 className="text-sm font-bold text-white">Pending Invites ({activeTeam.invites.length})</h3>
                  </div>
                  <div className="divide-y divide-white/4">
                    {activeTeam.invites.map((invite) => (
                      <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-500/20 text-xs font-bold text-gray-400">
                          {invite.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate">{invite.email}</p>
                          <p className="text-[11px] text-gray-600">Invited as {invite.role}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                          Pending
                        </span>
                        {canManage && (
                          <button onClick={() => removeInvite(invite.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors text-xs ml-1">
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invite form */}
              {canManage && (
                <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
                  <h3 className="text-sm font-bold text-white">Invite Member</h3>
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                      placeholder="colleague@company.com"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 focus:outline-none"
                    >
                      {(isOwner ? ["ADMIN", "MEMBER", "VIEWER"] : ["MEMBER", "VIEWER"]).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      onClick={sendInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white transition-colors"
                    >
                      {inviting ? "…" : "Invite"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
