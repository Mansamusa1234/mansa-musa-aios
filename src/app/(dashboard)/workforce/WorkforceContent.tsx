"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AgentCharacter, { AGENT_CONFIG } from "@/components/ui/AgentCharacter";
import type { AgentType, AgentStatus } from "@/components/ui/AgentCharacter";
import Link from "next/link";

// ── Agent roster ──────────────────────────────────────────────────────────────

interface AgentDef {
  type: AgentType;
  href: string;
  metrics: { label: string; value: string }[];
  tasks: string[];
}

const WORKFORCE: AgentDef[] = [
  {
    type: "ceo",
    href: "/dashboard",
    metrics: [
      { label: "Decisions made",   value: "847"   },
      { label: "Revenue influence", value: "£142k" },
      { label: "Uptime",           value: "99.9%" },
    ],
    tasks: ["Review pipeline", "Approve strategy", "Brief team"],
  },
  {
    type: "receptionist",
    href: "/receptionist",
    metrics: [
      { label: "Calls handled",  value: "3,291" },
      { label: "Leads captured", value: "428"   },
      { label: "Avg response",   value: "< 2s"  },
    ],
    tasks: ["Answer enquiry", "Book appointment", "Qualify lead"],
  },
  {
    type: "sales",
    href: "/crm",
    metrics: [
      { label: "Deals tracked",   value: "64"    },
      { label: "Pipeline value",  value: "£89k"  },
      { label: "Win rate",        value: "38%"   },
    ],
    tasks: ["Follow up lead", "Send proposal", "Update CRM"],
  },
  {
    type: "marketing",
    href: "/email-automation",
    metrics: [
      { label: "Campaigns sent",  value: "12"   },
      { label: "Open rate",       value: "41%"  },
      { label: "Subscribers",     value: "+289" },
    ],
    tasks: ["Write copy", "Schedule post", "Run campaign"],
  },
  {
    type: "legal",
    href: "/settings",
    metrics: [
      { label: "Contracts reviewed", value: "31"   },
      { label: "Compliance score",   value: "100%" },
      { label: "Risk level",         value: "Low"  },
    ],
    tasks: ["Review contract", "Check compliance", "Flag risk"],
  },
  {
    type: "finance",
    href: "/billing",
    metrics: [
      { label: "Revenue tracked",  value: "£38k" },
      { label: "Invoices sent",    value: "94"   },
      { label: "Collection rate",  value: "97%"  },
    ],
    tasks: ["Send invoice", "Reconcile books", "Report P&L"],
  },
  {
    type: "customer_success",
    href: "/crm",
    metrics: [
      { label: "NPS score",       value: "72"  },
      { label: "Churn prevented", value: "18"  },
      { label: "Tickets resolved", value: "99%" },
    ],
    tasks: ["Check-in client", "Resolve ticket", "Send survey"],
  },
];

// ── Agent-to-agent comms graph ────────────────────────────────────────────────

const COMM_PAIRS: [AgentType, AgentType][] = [
  ["ceo", "sales"],
  ["ceo", "finance"],
  ["receptionist", "sales"],
  ["sales", "customer_success"],
  ["marketing", "sales"],
  ["legal", "finance"],
];

// ── Live log pool ─────────────────────────────────────────────────────────────

const LOG_POOL: { agent: AgentType; msg: string }[] = [
  { agent: "receptionist",    msg: "Captured new lead: Sarah Mitchell (dental practice)" },
  { agent: "sales",           msg: "Moved Acme Ltd → Proposal stage" },
  { agent: "marketing",       msg: "Email campaign sent to 412 subscribers" },
  { agent: "ceo",             msg: "Weekly performance summary generated" },
  { agent: "finance",         msg: "Invoice #0094 sent to Johnson & Co — £2,400" },
  { agent: "legal",           msg: "Service agreement reviewed — no issues found" },
  { agent: "customer_success",msg: "NPS survey dispatched to 28 active clients" },
  { agent: "receptionist",    msg: "Appointment booked: Dr. Patel, 14 Jan 10am" },
  { agent: "sales",           msg: "Follow-up email sent to 6 warm leads" },
  { agent: "marketing",       msg: "Blog post scheduled: AI Receptionists for Dentists" },
  { agent: "finance",         msg: "Monthly P&L report ready — revenue up 22%" },
  { agent: "ceo",             msg: "Flagged 3 at-risk accounts for review" },
  { agent: "customer_success",msg: "Churn risk alert: TechCorp subscription expires in 7d" },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  leadsCount: number;
  openTickets: number;
  upcomingBookings: number;
  receptionistActive: boolean;
  receptionistChats: number;
  deployedAgents: number;
  competitions: number;
  wisdomAssets: number;
}

export default function WorkforceContent(props: Props) {
  const [statuses, setStatuses] = useState<Record<AgentType, AgentStatus>>(() =>
    Object.fromEntries(WORKFORCE.map((a) => [a.type, "idle"])) as Record<AgentType, AgentStatus>
  );
  const [selected, setSelected] = useState<AgentType | null>(null);
  const [log, setLog] = useState<{ id: number; agent: AgentType; msg: string; ts: Date }[]>([]);
  const [activeComm, setActiveComm] = useState<[AgentType, AgentType] | null>(null);
  const [nextId, setNextId] = useState(0);

  const tick = useCallback(() => {
    // Randomly activate an agent
    const agent = WORKFORCE[Math.floor(Math.random() * WORKFORCE.length)];
    const newStatus = (["thinking", "working", "communicating", "working"] as AgentStatus[])[
      Math.floor(Math.random() * 4)
    ];
    setStatuses((prev) => ({ ...prev, [agent.type]: newStatus }));
    setTimeout(() => {
      setStatuses((prev) => ({ ...prev, [agent.type]: "idle" }));
    }, 2800 + Math.random() * 4000);

    // Add log entry
    const entry = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
    setNextId((id) => {
      const newId = id + 1;
      setLog((l) => [{ id: newId, agent: entry.agent, msg: entry.msg, ts: new Date() }, ...l.slice(0, 14)]);
      return newId;
    });

    // Comms beam
    if (Math.random() > 0.45) {
      const pair = COMM_PAIRS[Math.floor(Math.random() * COMM_PAIRS.length)];
      setActiveComm(pair);
      setTimeout(() => setActiveComm(null), 1800);
    }
  }, []);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 3200);
    return () => clearInterval(interval);
  }, [tick]);

  const selAgent = selected ? WORKFORCE.find((a) => a.type === selected) : null;
  const selCfg = selected ? AGENT_CONFIG[selected] : null;
  const activeCount = Object.values(statuses).filter((s) => s !== "idle" && s !== "offline").length;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· AI Workforce ·</p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Your AI Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            7 agents running 24 / 7. Click any agent to drill into their activity.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
          <span className="text-xs text-green-400 font-semibold">{activeCount} agents active now</span>
        </div>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Leads in CRM",     value: String(props.leadsCount),       color: "text-brand-400"  },
          { label: "Open tickets",      value: String(props.openTickets),      color: "text-amber-400"  },
          { label: "Bookings (7d)",     value: String(props.upcomingBookings), color: "text-green-400"  },
          { label: "Agents deployed",   value: String(props.deployedAgents),   color: "text-purple-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Agent parade ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {WORKFORCE.map((agent) => {
          const cfg = AGENT_CONFIG[agent.type];
          const isSelected = selected === agent.type;
          const inComm = activeComm?.includes(agent.type);

          return (
            <motion.button
              key={agent.type}
              onClick={() => setSelected(isSelected ? null : agent.type)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors ${
                isSelected ? "border-white/25 bg-white/8" : "border-white/8 bg-white/3 hover:border-white/15"
              }`}
            >
              {/* Comms badge */}
              {inComm && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-[8px] text-white z-10"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 0.45, repeat: Infinity }}
                >
                  ✉
                </motion.div>
              )}

              <AgentCharacter
                type={agent.type}
                size={68}
                status={statuses[agent.type]}
                animate
                showStatus
              />
              <div>
                <p className="text-[11px] font-bold leading-tight" style={{ color: cfg.ring }}>
                  {cfg.label}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Agent detail panel ── */}
      <AnimatePresence>
        {selAgent && selCfg && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-white/10 bg-white/4 p-5"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Large character */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <AgentCharacter
                  type={selAgent.type}
                  size={116}
                  status={statuses[selAgent.type]}
                  animate
                  showStatus
                />
                <Link
                  href={selAgent.href}
                  className="rounded-xl border border-white/8 px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                >
                  Configure →
                </Link>
              </div>

              {/* Metrics + tasks */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-white">{selCfg.label} Agent</h2>
                  <p className="text-xs text-gray-400">{selCfg.role}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {selAgent.metrics.map((m) => (
                    <div key={m.label} className="rounded-xl bg-white/3 border border-white/6 p-3 text-center">
                      <p className="text-base font-extrabold" style={{ color: selCfg.ring }}>
                        {m.value}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Active tasks
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selAgent.tasks.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Network + live log ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Agent communication network */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-4">Agent network</p>
          <div className="space-y-3">
            {COMM_PAIRS.map(([a, b]) => {
              const cfgA = AGENT_CONFIG[a];
              const cfgB = AGENT_CONFIG[b];
              const isLive = activeComm?.[0] === a && activeComm?.[1] === b;

              return (
                <div key={`${a}-${b}`} className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold w-24 text-right truncate" style={{ color: cfgA.ring }}>
                    {cfgA.label}
                  </span>

                  {/* Beam track */}
                  <div className="relative flex-1 h-4 flex items-center">
                    <div className="absolute inset-x-0 h-px bg-white/8" />
                    {isLive && (
                      <motion.div
                        className="absolute w-2.5 h-2.5 rounded-full shadow-lg"
                        style={{ backgroundColor: cfgA.ring, boxShadow: `0 0 8px ${cfgA.ring}` }}
                        animate={{ left: ["0%", "95%"] }}
                        transition={{ duration: 0.65, ease: "easeInOut" }}
                      />
                    )}
                  </div>

                  <span className="text-[11px] font-semibold w-24 truncate" style={{ color: cfgB.ring }}>
                    {cfgB.label}
                  </span>

                  {isLive && (
                    <motion.span
                      className="text-[8px] font-mono text-brand-400 w-8 shrink-0"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                    >
                      LIVE
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live activity log */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Live activity</p>
            <motion.div
              className="flex items-center gap-1.5"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[9px] font-mono text-red-400">REC</span>
            </motion.div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {log.map((entry) => {
                const cfg = AGENT_CONFIG[entry.agent];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2 text-[11px]"
                  >
                    <span className="shrink-0 text-base leading-none mt-0.5">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold" style={{ color: cfg.ring }}>{cfg.label}: </span>
                      <span className="text-gray-400">{entry.msg}</span>
                    </div>
                    <span className="shrink-0 text-[8px] text-gray-600 font-mono mt-1">
                      {entry.ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {log.length === 0 && (
              <p className="text-xs text-gray-600">Waiting for agent activity…</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Upgrade CTA ── */}
      <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">Unlock all 7 agents at full capacity</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Upgrade to Professional or Enterprise to run unlimited calls, chats, and workflows.
          </p>
        </div>
        <Link
          href="/billing"
          className="shrink-0 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Upgrade plan →
        </Link>
      </div>

    </div>
  );
}
