"use client";

import { motion } from "framer-motion";

export type AgentType =
  | "receptionist"
  | "sales"
  | "support"
  | "booking"
  | "marketing"
  | "finance"
  | "research"
  | "security";

interface Props {
  type: AgentType;
  size?: number;
  animate?: boolean;
  className?: string;
}

const AGENT_CONFIG: Record<AgentType, {
  emoji: string;
  color: string;
  ring: string;
  pulseColor: string;
  label: string;
}> = {
  receptionist: { emoji: "🎙️", color: "#6366f1", ring: "#818cf8", pulseColor: "rgba(99,102,241,0.3)",   label: "Receptionist" },
  sales:        { emoji: "💼", color: "#10b981", ring: "#34d399", pulseColor: "rgba(16,185,129,0.3)",    label: "Sales" },
  support:      { emoji: "🛟", color: "#3b82f6", ring: "#60a5fa", pulseColor: "rgba(59,130,246,0.3)",    label: "Support" },
  booking:      { emoji: "📅", color: "#f59e0b", ring: "#fbbf24", pulseColor: "rgba(245,158,11,0.3)",    label: "Booking" },
  marketing:    { emoji: "📣", color: "#ec4899", ring: "#f472b6", pulseColor: "rgba(236,72,153,0.3)",    label: "Marketing" },
  finance:      { emoji: "💰", color: "#84cc16", ring: "#a3e635", pulseColor: "rgba(132,204,22,0.3)",    label: "Finance" },
  research:     { emoji: "🔬", color: "#06b6d4", ring: "#22d3ee", pulseColor: "rgba(6,182,212,0.3)",     label: "Research" },
  security:     { emoji: "🛡️", color: "#8b5cf6", ring: "#a78bfa", pulseColor: "rgba(139,92,246,0.3)",   label: "Security" },
};

export default function AgentCharacter({ type, size = 80, animate: doAnimate = true, className = "" }: Props) {
  const cfg = AGENT_CONFIG[type];
  const r = size / 2;
  const faceR = r * 0.55;
  const eyeR = faceR * 0.12;
  const eyeY = -faceR * 0.15;
  const eyeX = faceR * 0.28;
  const mouthY = faceR * 0.28;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Pulse ring */}
      {doAnimate && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: cfg.pulseColor }}
        />
      )}

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Orbit ring */}
        {doAnimate && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ originX: `${r}px`, originY: `${r}px` }}
          >
            <circle cx={r} cy={r} r={r * 0.88} stroke={cfg.ring} strokeWidth="1" strokeDasharray="4 6" strokeOpacity="0.4" fill="none" />
            <circle cx={r} cy={r * 0.12} r={r * 0.07} fill={cfg.ring} opacity="0.7" />
          </motion.g>
        )}

        {/* Body — floating */}
        <motion.g
          animate={doAnimate ? { y: [0, -6, 0] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: `${r}px`, originY: `${r}px` }}
        >
          {/* Shadow */}
          <ellipse cx={r} cy={r * 1.82} rx={faceR * 0.7} ry={faceR * 0.12} fill="#000" opacity="0.15" />

          {/* Head circle */}
          <circle cx={r} cy={r} r={faceR} fill={cfg.color} />
          <circle cx={r} cy={r} r={faceR} fill="url(#gloss)" />

          {/* Eyes with blink */}
          <motion.g
            animate={doAnimate ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.4, 0.45, 0.5, 1] }}
            style={{ originY: `${r}px` }}
          >
            <ellipse cx={r - eyeX} cy={r + eyeY} rx={eyeR} ry={eyeR * 1.2} fill="white" />
            <ellipse cx={r + eyeX} cy={r + eyeY} rx={eyeR} ry={eyeR * 1.2} fill="white" />
            <circle cx={r - eyeX + eyeR * 0.3} cy={r + eyeY} r={eyeR * 0.55} fill="#1e1b4b" />
            <circle cx={r + eyeX + eyeR * 0.3} cy={r + eyeY} r={eyeR * 0.55} fill="#1e1b4b" />
          </motion.g>

          {/* Smile */}
          <path
            d={`M ${r - eyeX * 0.7} ${r + mouthY} Q ${r} ${r + mouthY + eyeX * 0.5} ${r + eyeX * 0.7} ${r + mouthY}`}
            stroke="white"
            strokeWidth={eyeR * 0.9}
            strokeLinecap="round"
            fill="none"
          />

          {/* Emoji badge */}
          <text x={r} y={r - faceR * 0.52} textAnchor="middle" fontSize={faceR * 0.45} dominantBaseline="middle">
            {cfg.emoji}
          </text>
        </motion.g>

        {/* Gloss gradient */}
        <defs>
          <radialGradient id="gloss" cx="40%" cy="30%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export function AgentCharacterCard({ type, size = 80 }: { type: AgentType; size?: number }) {
  const cfg = AGENT_CONFIG[type];
  return (
    <div className="flex flex-col items-center gap-2">
      <AgentCharacter type={type} size={size} animate />
      <span className="text-xs font-semibold" style={{ color: cfg.ring }}>{cfg.label}</span>
    </div>
  );
}
