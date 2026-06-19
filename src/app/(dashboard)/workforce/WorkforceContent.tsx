"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";
import AnimatedWorkforceDashboard from "./AnimatedWorkforceDashboard";

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

const MODULES = [
  {
    id: "receptionist",
    name: "AI Receptionist Pro",
    desc: "24/7 website chat, lead capture, calendar booking, human handoff",
    href: "/receptionist",
    icon: "🤖",
    channels: ["Web Chat", "Email", "SMS*", "WhatsApp*", "Voice*"],
    status: "live",
    badge: null,
  },
  {
    id: "crm",
    name: "AI Sales Agent",
    desc: "Lead pipeline, qualification, proposals, CRM records, follow-ups",
    href: "/crm",
    icon: "💼",
    channels: ["CRM", "Pipeline", "Proposals"],
    status: "live",
    badge: null,
  },
  {
    id: "support",
    name: "AI Customer Support",
    desc: "AI-powered ticket resolution, smart responses, human escalation",
    href: "/support",
    icon: "🎧",
    channels: ["Tickets", "Email", "Live Chat"],
    status: "live",
    badge: "NEW",
  },
  {
    id: "calendar",
    name: "AI Calendar & Booking",
    desc: "Smart scheduling, availability management, confirmations, reminders",
    href: "/calendar",
    icon: "📅",
    channels: ["Booking Page", "Calendar", "Reminders"],
    status: "live",
    badge: "NEW",
  },
  {
    id: "arena",
    name: "Wisdom Arena",
    desc: "Multi-agent debate board for complex business decisions",
    href: "/arena",
    icon: "🏟️",
    channels: ["Multi-Agent", "Decision Board", "Synthesis"],
    status: "live",
    badge: null,
  },
  {
    id: "marketplace",
    name: "Agent Marketplace",
    desc: "41 specialist AI agents across finance, legal, marketing and more",
    href: "/marketplace",
    icon: "🏪",
    channels: ["41 Agents", "8 Categories", "Memory"],
    status: "live",
    badge: null,
  },
  {
    id: "intelligence",
    name: "Live Data Connectors",
    desc: "Real-time market data, news, crypto, company intelligence",
    href: "/intelligence",
    icon: "📡",
    channels: ["Market", "News", "Crypto", "Companies"],
    status: "live",
    badge: null,
  },
  {
    id: "analytics",
    name: "Revenue & Analytics",
    desc: "MRR tracking, user analytics, agent usage, plan conversion",
    href: "/analytics",
    icon: "📊",
    channels: ["Revenue", "Usage", "Conversion"],
    status: "live",
    badge: null,
  },
  {
    id: "referrals",
    name: "Referral & Affiliate",
    desc: "Growth engine with referral tracking, affiliate commissions, leaderboard",
    href: "/referrals",
    icon: "🔗",
    channels: ["Referrals", "Affiliate", "Leaderboard"],
    status: "live",
    badge: null,
  },
  {
    id: "admin",
    name: "Admin Control Centre",
    desc: "Users, coupons, campaigns, security dashboard, approval mode",
    href: "/admin",
    icon: "⚙️",
    channels: ["Users", "Security", "Approvals", "Logs"],
    status: "live",
    badge: null,
  },
  {
    id: "compete",
    name: "AI Competition System",
    desc: "24 specialist agents compete on your prompt — judge scores the winner",
    href: "/compete",
    icon: "⚔️",
    channels: ["24 Agents", "8 Categories", "Judge AI"],
    status: "live",
    badge: "NEW",
  },
  {
    id: "wisdom",
    name: "Wisdom Vault",
    desc: "Every winning competition answer preserved, rated and searchable",
    href: "/wisdom",
    icon: "💎",
    channels: ["Wisdom Assets", "Ratings", "Categories"],
    status: "live",
    badge: "NEW",
  },
  {
    id: "wisdom-leaderboard",
    name: "Agent Leaderboard",
    desc: "Lifetime rankings — win rate, accuracy score, user ratings per agent",
    href: "/wisdom-leaderboard",
    icon: "🏆",
    channels: ["Win Rate", "Accuracy", "Ratings"],
    status: "live",
    badge: "NEW",
  },
];

const COMING = [
  { name: "Voice Receptionist", desc: "Inbound / outbound voice calls via Twilio", requires: "Twilio API key", icon: "📞" },
  { name: "WhatsApp Agent", desc: "Automate WhatsApp Business conversations", requires: "Twilio WhatsApp", icon: "💬" },
  { name: "SMS Agent", desc: "Missed-call text-back and follow-up sequences", requires: "Twilio SMS", icon: "📱" },
  { name: "Stripe Payment Collection", desc: "Accept payments inside chat conversations", requires: "Stripe + webhooks", icon: "💳" },
];

export default function WorkforceContent({ leadsCount, openTickets, upcomingBookings, receptionistActive, receptionistChats, deployedAgents, competitions, wisdomAssets }: Props) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8 max-w-6xl">
      {/* Hero */}
      <motion.div variants={fadeUp}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Workforce OS ·</p>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Hire a full AI workforce<br className="hidden sm:block" /> in 5 minutes.</h1>
        <p className="mt-2 text-gray-500 max-w-2xl">Every agent you need to run your business — receptionist, sales, support, finance, operations — all in one platform. No hiring, no salary, no sick days.</p>
      </motion.div>

      {/* Live stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Leads tracked", value: leadsCount },
          { label: "Open support tickets", value: openTickets },
          { label: "Upcoming bookings", value: upcomingBookings },
          { label: "Receptionist chats", value: receptionistChats },
          { label: "Deployed agents", value: deployedAgents },
          { label: "Competitions run", value: competitions },
          { label: "Wisdom assets", value: wisdomAssets },
        ].map((s) => (
          <motion.div key={s.label} variants={scaleIn} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-2xl font-extrabold text-brand-400">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <AnimatedWorkforceDashboard />

      {/* Live modules grid */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-bold text-white mb-4">Active workforce modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <motion.div key={m.id} variants={scaleIn} whileHover={{ y: -4, transition: { duration: 0.18 } }}>
              <Link href={m.href} className="block h-full rounded-2xl border border-white/8 bg-white/3 p-5 hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex items-center gap-2">
                    {m.badge && <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold text-brand-400">{m.badge}</span>}
                    <span className="flex items-center gap-1 text-[10px] text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Live</span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors">{m.name}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {m.channels.map((c) => (
                    <span key={c} className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-gray-500">{c}</span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Coming soon — needs external keys */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-bold text-white mb-1">Unlock with external API keys</h2>
        <p className="text-xs text-gray-600 mb-4">Infrastructure is built. Add the API key to activate.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {COMING.map((m) => (
            <div key={m.name} className="flex items-center gap-4 rounded-xl border border-dashed border-white/10 bg-white/2 p-4">
              <span className="text-2xl flex-shrink-0">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-400">{m.name}</p>
                <p className="text-xs text-gray-600">{m.desc}</p>
              </div>
              <span className="flex-shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-400 font-semibold whitespace-nowrap">Needs: {m.requires.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
