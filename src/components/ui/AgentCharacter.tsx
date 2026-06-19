"use client";

import { motion, AnimatePresence } from "framer-motion";

// ── Agent types ───────────────────────────────────────────────────────────────

export type AgentType =
  | "ceo"
  | "receptionist"
  | "sales"
  | "marketing"
  | "legal"
  | "finance"
  | "customer_success"
  // legacy types kept for backward compat
  | "support"
  | "booking"
  | "research"
  | "security";

export type AgentStatus = "idle" | "thinking" | "working" | "communicating" | "offline";

// ── Config ────────────────────────────────────────────────────────────────────

export const AGENT_CONFIG: Record<AgentType, {
  emoji: string;
  color: string;
  ring: string;
  pulseColor: string;
  label: string;
  role: string;
  floatDuration: number;
  orbitDuration: number;
}> = {
  ceo:             { emoji: "👑", color: "#7c3aed", ring: "#a78bfa", pulseColor: "rgba(124,58,237,0.35)",  label: "CEO",              role: "Chief Executive",    floatDuration: 4,   orbitDuration: 10 },
  receptionist:    { emoji: "🎙️", color: "#6366f1", ring: "#818cf8", pulseColor: "rgba(99,102,241,0.3)",  label: "Receptionist",     role: "Front Desk AI",      floatDuration: 2.8, orbitDuration: 8  },
  sales:           { emoji: "💼", color: "#10b981", ring: "#34d399", pulseColor: "rgba(16,185,129,0.3)",   label: "Sales",            role: "Revenue Growth AI",  floatDuration: 3.2, orbitDuration: 7  },
  marketing:       { emoji: "📣", color: "#ec4899", ring: "#f472b6", pulseColor: "rgba(236,72,153,0.3)",   label: "Marketing",        role: "Brand & Content AI", floatDuration: 3.5, orbitDuration: 9  },
  legal:           { emoji: "⚖️", color: "#64748b", ring: "#94a3b8", pulseColor: "rgba(100,116,139,0.3)",  label: "Legal",            role: "Compliance AI",      floatDuration: 4.2, orbitDuration: 12 },
  finance:         { emoji: "💰", color: "#84cc16", ring: "#a3e635", pulseColor: "rgba(132,204,22,0.3)",   label: "Finance",          role: "CFO Intelligence",   floatDuration: 3.8, orbitDuration: 11 },
  customer_success:{ emoji: "🌟", color: "#f97316", ring: "#fb923c", pulseColor: "rgba(249,115,22,0.3)",   label: "Customer Success", role: "Retention AI",       floatDuration: 3.0, orbitDuration: 8  },
  // legacy
  support:         { emoji: "🛟", color: "#3b82f6", ring: "#60a5fa", pulseColor: "rgba(59,130,246,0.3)",   label: "Support",          role: "Help Desk AI",       floatDuration: 3,   orbitDuration: 8  },
  booking:         { emoji: "📅", color: "#f59e0b", ring: "#fbbf24", pulseColor: "rgba(245,158,11,0.3)",   label: "Booking",          role: "Scheduling AI",      floatDuration: 3,   orbitDuration: 8  },
  research:        { emoji: "🔬", color: "#06b6d4", ring: "#22d3ee", pulseColor: "rgba(6,182,212,0.3)",    label: "Research",         role: "Intelligence AI",    floatDuration: 3,   orbitDuration: 8  },
  security:        { emoji: "🛡️", color: "#8b5cf6", ring: "#a78bfa", pulseColor: "rgba(139,92,246,0.3)",  label: "Security",         role: "Protection AI",      floatDuration: 3,   orbitDuration: 8  },
};

// ── Status colours ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AgentStatus, { label: string; dot: string; glow: string }> = {
  idle:          { label: "Idle",          dot: "bg-gray-400",   glow: "" },
  thinking:      { label: "Thinking…",     dot: "bg-amber-400",  glow: "shadow-amber-400/40" },
  working:       { label: "Working",       dot: "bg-green-400",  glow: "shadow-green-400/40" },
  communicating: { label: "Messaging",     dot: "bg-brand-400",  glow: "shadow-brand-400/40" },
  offline:       { label: "Offline",       dot: "bg-gray-600",   glow: "" },
};

// ── Main AgentCharacter ───────────────────────────────────────────────────────

interface AgentCharacterProps {
  type: AgentType;
  size?: number;
  status?: AgentStatus;
  animate?: boolean;
  showStatus?: boolean;
  className?: string;
}

export default function AgentCharacter({
  type,
  size = 80,
  status = "idle",
  animate: doAnimate = true,
  showStatus = false,
  className = "",
}: AgentCharacterProps) {
  const cfg = AGENT_CONFIG[type];
  const r = size / 2;
  const faceR = r * 0.52;
  const eyeR = faceR * 0.12;
  const eyeY = -faceR * 0.14;
  const eyeX = faceR * 0.27;
  const mouthY = faceR * 0.27;

  const isThinking = status === "thinking";
  const isWorking = status === "working";
  const isCommunicating = status === "communicating";
  const isOffline = status === "offline";

  // Orbit speed changes by status
  const orbitDur = isWorking ? cfg.orbitDuration * 0.4 : isThinking ? cfg.orbitDuration * 0.6 : cfg.orbitDuration;

  return (
    <div className={`relative inline-flex flex-col items-center gap-1.5 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Offline overlay */}
        {isOffline && (
          <div className="absolute inset-0 rounded-full bg-gray-900/60 z-10 flex items-center justify-center">
            <span className="text-gray-500 text-lg">Zzz</span>
          </div>
        )}

        {/* Communicating burst rings */}
        {isCommunicating && doAnimate && (
          <>
            {[0, 0.5, 1].map((delay) => (
              <motion.div
                key={delay}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: cfg.ring }}
                animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay, ease: "easeOut" }}
              />
            ))}
          </>
        )}

        {/* Idle / working pulse */}
        {doAnimate && !isOffline && !isCommunicating && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: cfg.pulseColor }}
            animate={isWorking
              ? { scale: [1, 1.2, 1], opacity: [0.7, 0.3, 0.7] }
              : { scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }
            }
            transition={{ duration: isWorking ? 1 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isOffline ? "opacity-40" : ""}
        >
          {/* Orbit ring */}
          {doAnimate && !isOffline && (
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: orbitDur, repeat: Infinity, ease: "linear" }}
              style={{ originX: `${r}px`, originY: `${r}px` }}
            >
              <circle
                cx={r} cy={r} r={r * 0.87}
                stroke={cfg.ring}
                strokeWidth={isWorking ? "1.5" : "1"}
                strokeDasharray={isWorking ? "3 4" : "4 6"}
                strokeOpacity={isWorking ? "0.7" : "0.35"}
                fill="none"
              />
              <circle cx={r} cy={r * 0.13} r={r * 0.07} fill={cfg.ring} opacity="0.8" />
              {isWorking && (
                <circle cx={r} cy={r * 1.87} r={r * 0.05} fill={cfg.ring} opacity="0.6" />
              )}
            </motion.g>
          )}

          {/* Body — floating */}
          <motion.g
            animate={doAnimate && !isOffline ? {
              y: isThinking
                ? [0, -3, 0, -3, 0]
                : isWorking
                ? [0, -8, 0]
                : [0, -(size * 0.075), 0],
            } : undefined}
            transition={{
              duration: isThinking ? 1.2 : isWorking ? 1.5 : cfg.floatDuration,
              repeat: Infinity,
              ease: isWorking ? "easeInOut" : "easeInOut",
            }}
          >
            {/* Drop shadow */}
            <motion.ellipse
              cx={r} cy={r * 1.84}
              rx={faceR * 0.65} ry={faceR * 0.11}
              fill="#000" opacity="0.12"
              animate={doAnimate && !isOffline ? { rx: [faceR * 0.65, faceR * 0.55, faceR * 0.65] } : undefined}
              transition={{ duration: isWorking ? 1.5 : cfg.floatDuration, repeat: Infinity }}
            />

            {/* Face */}
            <circle cx={r} cy={r} r={faceR} fill={cfg.color} />

            {/* Gloss */}
            <circle cx={r} cy={r} r={faceR} fill={`url(#gloss-${type})`} />

            {/* Thinking — spinning dots above head */}
            {isThinking && doAnimate && (
              <motion.g animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ originX: `${r}px`, originY: `${r - faceR * 1.1}px` }}>
                {[0, 120, 240].map((deg, i) => {
                  const rad = (deg * Math.PI) / 180;
                  const dx = Math.cos(rad) * faceR * 0.35;
                  const dy = Math.sin(rad) * faceR * 0.35;
                  return (
                    <motion.circle
                      key={i}
                      cx={r + dx} cy={r - faceR * 1.1 + dy}
                      r={eyeR * 0.7}
                      fill={cfg.ring}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.27 }}
                    />
                  );
                })}
              </motion.g>
            )}

            {/* Working — lightning bolt above head */}
            {isWorking && doAnimate && (
              <motion.text
                x={r} y={r - faceR * 1.2}
                textAnchor="middle"
                fontSize={faceR * 0.5}
                dominantBaseline="middle"
                animate={{ opacity: [1, 0.4, 1], y: [r - faceR * 1.2, r - faceR * 1.35, r - faceR * 1.2] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                ⚡
              </motion.text>
            )}

            {/* Eyes */}
            <motion.g
              animate={doAnimate && !isOffline
                ? isThinking
                  ? { scaleY: [1, 0.4, 1, 0.4, 1] }
                  : { scaleY: [1, 1, 0.1, 1, 1] }
                : undefined}
              transition={{
                duration: isThinking ? 1 : 4,
                repeat: Infinity,
                times: isThinking ? [0, 0.3, 0.6, 0.8, 1] : [0, 0.4, 0.45, 0.5, 1],
              }}
              style={{ originY: `${r}px` }}
            >
              <ellipse cx={r - eyeX} cy={r + eyeY} rx={eyeR} ry={eyeR * 1.2} fill="white" />
              <ellipse cx={r + eyeX} cy={r + eyeY} rx={eyeR} ry={eyeR * 1.2} fill="white" />
              {/* Pupils — look left/right when thinking */}
              <motion.g
                animate={doAnimate && isThinking ? { x: [-eyeR * 0.4, eyeR * 0.4, -eyeR * 0.4] } : undefined}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <circle cx={r - eyeX + eyeR * 0.3} cy={r + eyeY} r={eyeR * 0.55} fill="#1e1b4b" />
                <circle cx={r + eyeX + eyeR * 0.3} cy={r + eyeY} r={eyeR * 0.55} fill="#1e1b4b" />
              </motion.g>
            </motion.g>

            {/* Mouth — changes by status */}
            {isThinking ? (
              // Slightly open "hmm" mouth
              <ellipse
                cx={r} cy={r + mouthY}
                rx={eyeX * 0.5} ry={eyeR * 0.7}
                fill="white" opacity="0.6"
              />
            ) : isWorking ? (
              // Open excited mouth
              <motion.ellipse
                cx={r} cy={r + mouthY}
                rx={eyeX * 0.8} ry={eyeR * 1.1}
                fill="white" opacity="0.7"
                animate={{ ry: [eyeR * 1.1, eyeR * 0.6, eyeR * 1.1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            ) : (
              // Standard smile
              <path
                d={`M ${r - eyeX * 0.7} ${r + mouthY} Q ${r} ${r + mouthY + eyeX * 0.45} ${r + eyeX * 0.7} ${r + mouthY}`}
                stroke="white"
                strokeWidth={eyeR * 0.85}
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Role emoji badge */}
            <text
              x={r} y={r - faceR * 0.5}
              textAnchor="middle"
              fontSize={faceR * 0.42}
              dominantBaseline="middle"
            >
              {cfg.emoji}
            </text>
          </motion.g>

          <defs>
            <radialGradient id={`gloss-${type}`} cx="38%" cy="28%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="0.28" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Status indicator */}
      {showStatus && (
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 bg-black/30 border border-white/8`}>
          <motion.div
            className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[status].dot}`}
            animate={status !== "idle" && status !== "offline" ? { opacity: [1, 0.3, 1] } : undefined}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
          <span className="text-[9px] font-medium text-gray-300">{STATUS_CONFIG[status].label}</span>
        </div>
      )}
    </div>
  );
}

// ── Card variant ──────────────────────────────────────────────────────────────

interface AgentCharacterCardProps {
  type: AgentType;
  size?: number;
  status?: AgentStatus;
}

export function AgentCharacterCard({ type, size = 80, status = "idle" }: AgentCharacterCardProps) {
  const cfg = AGENT_CONFIG[type];
  return (
    <div className="flex flex-col items-center gap-2">
      <AgentCharacter type={type} size={size} status={status} animate showStatus />
      <div className="text-center">
        <p className="text-xs font-bold" style={{ color: cfg.ring }}>{cfg.label}</p>
        <p className="text-[10px] text-gray-500">{cfg.role}</p>
      </div>
    </div>
  );
}

// ── Communication beam ────────────────────────────────────────────────────────

interface CommBeamProps {
  fromColor: string;
  toColor: string;
  active: boolean;
}

export function CommBeam({ fromColor, toColor, active }: CommBeamProps) {
  if (!active) return null;
  return (
    <div className="relative flex items-center justify-center w-full h-4">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r opacity-30"
        style={{ backgroundImage: `linear-gradient(to right, ${fromColor}, ${toColor})` }}
      />
      <motion.div
        className="absolute w-2 h-2 rounded-full"
        style={{ backgroundColor: fromColor }}
        animate={{ x: ["-50%", "50%"] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
