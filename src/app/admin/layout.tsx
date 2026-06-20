import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex h-screen bg-[#070712]">
      <aside className="w-56 flex-col border-r border-white/6 bg-[#0a0a18] hidden md:flex">
        <div className="px-5 py-5">
          <span className="text-sm font-bold text-white">Mansa<span className="text-brand-400">Musa</span>AI</span>
          <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 text-xs font-semibold text-red-400">
            Admin
          </span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {[
            { href: "/admin", label: "Overview" },
            { href: "/admin/users", label: "Users" },
            { href: "/admin/billing", label: "Billing" },
            { href: "/admin/commissions", label: "Commissions" },
            { href: "/admin/connectors", label: "Connectors" },
            { href: "/admin/coupons", label: "Coupons" },
            { href: "/admin/marketing", label: "Marketing" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex rounded-xl px-3 py-2 text-sm font-medium text-gray-400 hover:bg-white/4 hover:text-gray-200 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="flex rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-300 transition-colors"
          >
            ← Back to app
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
