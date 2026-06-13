"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r border-gray-100 bg-white md:flex">
        <div className="px-5 py-5">
          <span className="text-lg font-bold text-brand-600">MansaMusaAI</span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-base">⚙</span>
              Admin
            </Link>
          )}
        </nav>

        <div className="border-t border-gray-100 px-5 py-4">
          <p className="truncate text-xs font-medium text-gray-700">{user.name}</p>
          <p className="truncate text-xs text-gray-400">{user.email}</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-100 bg-white md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-1 flex-col items-center py-3 text-xs font-medium transition-colors ${
              pathname.startsWith(l.href) ? "text-brand-600" : "text-gray-400"
            }`}
          >
            <span className="text-lg">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
