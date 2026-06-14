"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface Props {
  user: { name?: string | null; email?: string | null; role?: string };
}

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/chat", label: "Chat", icon: "✦" },
  { href: "/billing", label: "Billing", icon: "◈" },
];

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();

  const allLinks = [
    ...links,
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: "⚙" }] : []),
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="hidden w-60 flex-col border-r border-gray-100 bg-white md:flex"
      >
        <div className="px-5 py-5">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Mansa<span className="text-brand-600">Musa</span>AI
          </span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {allLinks.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-brand-50"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-base">{l.icon}</span>
                <span className="relative z-10">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-700">{user.name}</p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile bottom nav */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-100 bg-white/95 backdrop-blur-sm md:hidden"
      >
        {allLinks.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`relative flex flex-1 flex-col items-center py-3 text-xs font-medium transition-colors ${
                active ? "text-brand-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-brand-500"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="text-lg">{l.icon}</span>
              <span className="mt-0.5">{l.label}</span>
            </Link>
          );
        })}
      </motion.nav>
    </>
  );
}
