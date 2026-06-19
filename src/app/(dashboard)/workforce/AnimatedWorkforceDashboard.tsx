"use client";

import { motion } from "framer-motion";
import { fadeUp, scaleIn, stagger } from "@/lib/motion";

type AgentState = "idle" | "thinking" | "working" | "success";

interface WorkforceAgent {
  name: string;
  role: string;
  icon: string;
  color: string;
  task: string;
  metric: string;
  activeState: AgentState;
}

interface CommunicationPath {
  from: string;
  to: string;
  signal: string;
  color: string;
  points: {
    from: { x: number; y: number };
    to: { x: number; y: number };
  };
}

const AGENTS: WorkforceAgent[] = [
  {
    name: "CEO",
    role: "Strategy command",
    icon: "♛",
    color: "#f59e0b",
    task: "Prioritizing weekly revenue moves",
    metric: "92% decision confidence",
    activeState: "thinking",
  },
  {
    name: "Finance",
    role: "Cashflow control",
    icon: "$",
    color: "#22c55e",
    task: "Reconciling margin scenarios",
    metric: "+18% runway clarity",
    activeState: "working",
  },
  {
    name: "Marketing",
    role: "Growth engine",
    icon: "M",
    color: "#ec4899",
    task: "Testing audience angles",
    metric: "6 campaigns live",
    activeState: "idle",
  },
  {
    name: "Sales",
    role: "Pipeline closer",
    icon: "S",
    color: "#38bdf8",
    task: "Routing hot leads to offers",
    metric: "14 deals advanced",
    activeState: "success",
  },
  {
    name: "Legal",
    role: "Risk shield",
    icon: "L",
    color: "#a78bfa",
    task: "Reviewing vendor clauses",
    metric: "3 risks flagged",
    activeState: "thinking",
  },
  {
    name: "Operations",
    role: "Execution hub",
    icon: "O",
    color: "#fb7185",
    task: "Balancing team capacity",
    metric: "11 workflows synced",
    activeState: "working",
  },
  {
    name: "Customer Success",
    role: "Retention loop",
    icon: "CS",
    color: "#34d399",
    task: "Detecting expansion signals",
    metric: "98% health score",
    activeState: "success",
  },
];

const COMMUNICATIONS: CommunicationPath[] = [
  {
    from: "CEO",
    to: "Finance",
    signal: "Budget guardrails",
    color: "#f59e0b",
    points: { from: { x: 18, y: 22 }, to: { x: 48, y: 22 } },
  },
  {
    from: "Finance",
    to: "Sales",
    signal: "Pricing thresholds",
    color: "#22c55e",
    points: { from: { x: 52, y: 25 }, to: { x: 82, y: 25 } },
  },
  {
    from: "Marketing",
    to: "Sales",
    signal: "Qualified demand",
    color: "#ec4899",
    points: { from: { x: 24, y: 48 }, to: { x: 78, y: 42 } },
  },
  {
    from: "Legal",
    to: "Operations",
    signal: "Approval packet",
    color: "#a78bfa",
    points: { from: { x: 28, y: 75 }, to: { x: 56, y: 74 } },
  },
  {
    from: "Operations",
    to: "Customer Success",
    signal: "Delivery status",
    color: "#fb7185",
    points: { from: { x: 60, y: 75 }, to: { x: 84, y: 74 } },
  },
  {
    from: "Customer Success",
    to: "CEO",
    signal: "Retention insight",
    color: "#34d399",
    points: { from: { x: 86, y: 68 }, to: { x: 16, y: 28 } },
  },
];

const STATE_LABELS: Record<AgentState, string> = {
  idle: "Idle",
  thinking: "Thinking",
  working: "Working",
  success: "Success",
};

const STATE_DESCRIPTIONS: Record<AgentState, string> = {
  idle: "Monitoring",
  thinking: "Reasoning",
  working: "Executing",
  success: "Completed",
};

const stateOrder: AgentState[] = ["idle", "thinking", "working", "success"];

function AgentAvatar({ agent, index }: { agent: WorkforceAgent; index: number }) {
  const baseTransition = { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const, delay: index * 0.08 };

  const animationByState = {
    idle: {
      animate: { y: [0, -4, 0], scale: [1, 1.02, 1] },
      transition: baseTransition,
    },
    thinking: {
      animate: { rotate: [0, -5, 5, 0], scale: [1, 1.04, 1] },
      transition: { ...baseTransition, duration: 1.8 },
    },
    working: {
      animate: { x: [0, 3, -3, 0], y: [0, -2, 2, 0] },
      transition: { ...baseTransition, duration: 1.1 },
    },
    success: {
      animate: { scale: [1, 1.12, 1], boxShadow: [`0 0 0px ${agent.color}`, `0 0 22px ${agent.color}`, `0 0 0px ${agent.color}`] },
      transition: { ...baseTransition, duration: 2 },
    },
  } satisfies Record<AgentState, { animate: Record<string, string[] | number[]>; transition: typeof baseTransition }>;

  return (
    <motion.div
      {...animationByState[agent.activeState]}
      className="relative grid h-14 w-14 place-items-center rounded-2xl border text-lg font-black text-white"
      style={{
        borderColor: `${agent.color}55`,
        background: `radial-gradient(circle at 30% 20%, ${agent.color}55, rgba(255,255,255,0.06) 42%, rgba(8,8,18,0.9) 100%)`,
      }}
    >
      <span>{agent.icon}</span>
      <motion.span
        className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[#080812]"
        style={{ backgroundColor: agent.color }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
      />
    </motion.div>
  );
}

function StateAnimation({ state, color, active, delay }: { state: AgentState; color: string; active: boolean; delay: number }) {
  return (
    <div
      className={`rounded-xl border px-2 py-2 transition-colors ${active ? "bg-white/8" : "bg-white/[0.025]"}`}
      style={{ borderColor: active ? `${color}66` : "rgba(255,255,255,0.08)" }}
    >
      <div className="mb-1 flex h-6 items-center justify-center">
        {state === "idle" && (
          <motion.span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.45, 0.95, 0.45] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay }}
          />
        )}
        {state === "thinking" && (
          <div className="flex gap-1">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: delay + dot * 0.12 }}
              />
            ))}
          </div>
        )}
        {state === "working" && (
          <div className="flex h-5 items-end gap-0.5">
            {[0, 1, 2, 3].map((bar) => (
              <motion.span
                key={bar}
                className="w-1 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ height: [6, 18, 9, 14, 6], opacity: [0.5, 1, 0.65, 0.9, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: delay + bar * 0.09 }}
              />
            ))}
          </div>
        )}
        {state === "success" && (
          <motion.div
            className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-black text-[#05050b]"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.16, 1], rotate: [0, 0, -8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay }}
          >
            ✓
          </motion.div>
        )}
      </div>
      <p className="text-center text-[9px] font-semibold text-gray-500">{STATE_LABELS[state]}</p>
    </div>
  );
}

function AgentCard({ agent, index }: { agent: WorkforceAgent; index: number }) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.18 } }}
      className="group relative overflow-hidden rounded-3xl border border-white/8 bg-[#0b0b18]/90 p-4 backdrop-blur-sm"
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.1 }}
      />
      <div className="relative flex items-start gap-3">
        <AgentAvatar agent={agent} index={index} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">{agent.name}</h3>
              <p className="text-[11px] text-gray-500">{agent.role}</p>
            </div>
            <span
              className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ borderColor: `${agent.color}55`, color: agent.color, backgroundColor: `${agent.color}14` }}
            >
              {STATE_LABELS[agent.activeState]}
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gray-400">{agent.task}</p>
          <p className="mt-2 text-[11px] font-semibold" style={{ color: agent.color }}>
            {agent.metric}
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-4 gap-1.5">
        {stateOrder.map((state, stateIndex) => (
          <StateAnimation
            key={state}
            state={state}
            color={agent.color}
            active={agent.activeState === state}
            delay={index * 0.08 + stateIndex * 0.05}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-600">
        <span>{STATE_DESCRIPTIONS[agent.activeState]}</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
          Live agent
        </span>
      </div>
    </motion.div>
  );
}

function CommunicationLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      <svg className="absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {COMMUNICATIONS.map((path, index) => (
          <motion.line
            key={`${path.from}-${path.to}`}
            x1={path.points.from.x}
            y1={path.points.from.y}
            x2={path.points.to.x}
            y2={path.points.to.y}
            stroke={path.color}
            strokeWidth="0.18"
            strokeLinecap="round"
            strokeDasharray="1 1.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1], opacity: [0, 0.55, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
          />
        ))}
      </svg>

      {COMMUNICATIONS.map((path, index) => (
        <motion.span
          key={`${path.from}-${path.to}-pulse`}
          className="absolute hidden h-2.5 w-2.5 rounded-full shadow-lg lg:block"
          style={{
            backgroundColor: path.color,
            left: `${path.points.from.x}%`,
            top: `${path.points.from.y}%`,
            boxShadow: `0 0 18px ${path.color}`,
          }}
          animate={{
            left: [`${path.points.from.x}%`, `${path.points.to.x}%`],
            top: [`${path.points.from.y}%`, `${path.points.to.y}%`],
            scale: [0.7, 1.25, 0.7],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
        />
      ))}
    </div>
  );
}

export default function AnimatedWorkforceDashboard() {
  return (
    <motion.section variants={fadeUp} className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.025] p-4 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_32%)]" />
      <CommunicationLayer />

      <div className="relative">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Animated command center</p>
            <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Seven AI agents moving work forward</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Watch strategy, revenue, compliance, operations, and retention agents exchange signals while each cycles through idle,
              thinking, working, and success motions.
            </p>
          </div>
          <div className="rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-300">Network health</p>
            <p className="text-xl font-extrabold text-white">Live sync</p>
          </div>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AGENTS.map((agent, index) => (
            <AgentCard key={agent.name} agent={agent} index={index} />
          ))}
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNICATIONS.map((path, index) => (
            <motion.div
              key={path.signal}
              variants={scaleIn}
              className="relative overflow-hidden rounded-2xl border border-white/8 bg-black/20 p-3"
            >
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <span>{path.from}</span>
                <span>{path.to}</span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.span
                  className="absolute inset-y-0 left-0 w-1/3 rounded-full"
                  style={{ backgroundColor: path.color, boxShadow: `0 0 16px ${path.color}` }}
                  animate={{ x: ["-110%", "330%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">{path.signal}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
