"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AGENTS } from "@/data/agents";

/* ── Inline SVG icon set ──────────────────────────────────── */
type IK = "home" | "chart" | "store" | "bot" | "news" | "globe" | "chat" | "currency" | "users" | "user" | "card" | "shield" | "analytics" | "gift" | "link" | "arena" | "settings" | "crm" | "receptionist" | "workforce" | "support" | "calendar" | "layers" | "compete" | "wisdom" | "trophy";

const ICONS: Record<IK, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  bot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <path d="M12 11V7m-3 4V7m6 4V7"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/>
      <path d="M9 7h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1z"/>
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 0 2-2V7m-2 13a2 2 0 0 1-2-2V7m2 0H7"/>
      <line x1="7" y1="10" x2="12" y2="10"/><line x1="7" y1="14" x2="12" y2="14"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  currency: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  crm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  workforce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  receptionist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 8v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8"/>
      <path d="M12 8c-1.5-4-7-3.5-7-0.5C5 9 8 8 12 8zM12 8c1.5-4 7-3.5 7-0.5C19 9 16 8 12 8z"/>
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  arena: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M4 4l16 16M20 4 4 20"/>
      <circle cx="12" cy="12" r="9"/>
    </svg>
  ),
  compete: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
      <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
      <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
      <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
      <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
      <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
      <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/>
    </svg>
  ),
  wisdom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
};

/* ── Nav structure ────────────────────────────────────────── */
type NavItem = { href: string; label: string; icon: IK; adminOnly?: boolean; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard",   label: "Dashboard",   icon: "home"       },
      { href: "/workforce",   label: "Workforce OS", icon: "workforce", badge: "HQ" },
      { href: "/analytics",   label: "Analytics",   icon: "analytics"  },
    ],
  },
  {
    label: "Agents",
    items: [
      { href: "/marketplace",      label: "Marketplace",  icon: "store", badge: String(AGENTS.length) },
      { href: "/agent-dashboard",  label: "My Agents",    icon: "bot"   },
      { href: "/arena",            label: "Agent Arena",  icon: "arena", badge: "NEW" },
      { href: "/model-hub",        label: "Model Hub",    icon: "layers", badge: "NEW" },
    ],
  },
  {
    label: "Wisdom Economy",
    items: [
      { href: "/compete",           label: "Compete",        icon: "compete", badge: "NEW" },
      { href: "/wisdom",            label: "Wisdom Vault",   icon: "wisdom"              },
      { href: "/wisdom-leaderboard",label: "Leaderboard",    icon: "trophy"              },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/news",         label: "News Feed",    icon: "news"     },
      { href: "/intelligence", label: "Market Intel", icon: "globe"    },
      { href: "/evidence",     label: "Evidence Vault", icon: "shield", badge: "NEW" },
      { href: "/legal-dictionary", label: "Legal Dictionary", icon: "wisdom" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/chat",         label: "AI Chat",      icon: "chat"          },
      { href: "/agents",       label: "AI Agents",    icon: "bot", badge: "NEW" },
      { href: "/crm",          label: "CRM",          icon: "crm"           },
      { href: "/receptionist", label: "Receptionist", icon: "receptionist"  },
      { href: "/whatsapp",       label: "WhatsApp",     icon: "chat", badge: "NEW" },
      { href: "/email-automation", label: "Email Auto",  icon: "chat" },
      { href: "/support",      label: "Support",      icon: "support", badge: "NEW" },
      { href: "/calendar",     label: "Calendar",     icon: "calendar", badge: "NEW" },
      { href: "/revenue",      label: "Revenue",      icon: "currency", adminOnly: true },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/referrals", label: "Referrals", icon: "gift" },
      { href: "/affiliate", label: "Affiliate",  icon: "link" },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/team",    label: "Team",    icon: "users", adminOnly: true },
      { href: "/billing", label: "Billing", icon: "card"  },
      { href: "/portal",  label: "Portal",  icon: "user"  },
      { href: "/settings",label: "Settings",icon: "settings" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin",          label: "Admin Panel",  icon: "shield",   adminOnly: true },
      { href: "/admin/security", label: "Security",     icon: "shield",   adminOnly: true },
      { href: "/admin/models",   label: "Model Hub",    icon: "layers",   adminOnly: true },
    ],
  },
];

/* Mobile bottom nav — 6 most important */
const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard",  label: "Home",    icon: "home"     },
  { href: "/marketplace",label: "Agents",  icon: "store"    },
  { href: "/chat",       label: "Chat",    icon: "chat"     },
  { href: "/news",       label: "News",    icon: "news"     },
  { href: "/billing",    label: "Billing", icon: "card"     },
];

/* ── Component ────────────────────────────────────────────── */
interface Props {
  user: { name?: string | null; email?: string | null; role?: string };
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="hidden w-56 flex-shrink-0 flex-col border-r border-white/6 bg-[#0a0a18] md:flex"
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/6">
          <Link href="/dashboard" className="block">
            <span className="text-[15px] font-bold tracking-tight text-white">
              Mansa<span className="text-brand-400">Musa</span>
              <span className="text-gray-500">AI</span>
            </span>
          </Link>
          <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-widest">AI Operating System</p>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((i) => !i.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                          active
                            ? "bg-brand-500/15 text-brand-300"
                            : "text-gray-500 hover:bg-white/4 hover:text-gray-200"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg bg-brand-500/15 border border-brand-500/20"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span className={`relative z-10 flex-shrink-0 ${active ? "text-brand-400" : "text-gray-500"}`}>
                          {ICONS[item.icon]}
                        </span>
                        <span className="relative z-10 flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="relative z-10 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-400">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-white/6 px-3 py-4">
          <div className="flex items-center gap-2.5 rounded-lg border border-white/6 bg-white/3 px-3 py-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-300">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-gray-300">{user.name ?? "User"}</p>
              <p className="truncate text-[10px] text-gray-500">{user.role ?? "Member"}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Mobile bottom nav ────────────────────────── */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/8 bg-[#0a0a18]/95 backdrop-blur-xl md:hidden"
      >
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center py-3 text-[10px] font-semibold transition-colors ${
                active ? "text-brand-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-brand-400"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={`${active ? "text-brand-400" : "text-gray-500"}`}>{ICONS[item.icon]}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </motion.nav>
    </>
  );
}
