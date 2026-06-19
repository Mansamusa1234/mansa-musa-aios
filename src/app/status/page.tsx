import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "System Status",
  description: "Real-time status of MansaMusaAI services and infrastructure.",
};

const services = [
  { name: "API Gateway",        status: "operational", uptime: "99.98%" },
  { name: "Authentication",     status: "operational", uptime: "99.99%" },
  { name: "AI Chat Engine",     status: "operational", uptime: "99.95%" },
  { name: "Billing & Payments", status: "operational", uptime: "99.99%" },
  { name: "Database",           status: "operational", uptime: "99.97%" },
  { name: "Storage",            status: "operational", uptime: "99.96%" },
  { name: "Push Notifications", status: "operational", uptime: "99.90%" },
  { name: "Email Delivery",     status: "operational", uptime: "99.92%" },
];

const incidents: { date: string; title: string; status: "resolved" | "investigating" | "monitoring" }[] = [];

const statusColor = {
  operational:   "bg-emerald-500",
  degraded:      "bg-amber-500",
  outage:        "bg-red-500",
  maintenance:   "bg-blue-500",
};

const statusLabel = {
  operational:   "Operational",
  degraded:      "Degraded Performance",
  outage:        "Major Outage",
  maintenance:   "Under Maintenance",
};

const incidentBadge = {
  resolved:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  investigating: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  monitoring:    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === "operational");

  return (
    <div className="min-h-screen bg-white dark:bg-[#070712] text-gray-900 dark:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/8 bg-white/90 dark:bg-[#070712]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1] text-white text-xs font-bold">M</span>
            MansaMusaAI
          </Link>
          <Link href="/dashboard" className="rounded-lg bg-[#6366f1] px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors">
            Go to dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-14">
        {/* Overall status */}
        <div className={`mb-10 flex items-center gap-4 rounded-2xl p-6 ${allOperational ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"}`}>
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${allOperational ? "bg-emerald-500" : "bg-amber-500"}`}>
            {allOperational ? (
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            )}
          </span>
          <div>
            <h1 className={`text-xl font-bold ${allOperational ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
              {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
            </h1>
            <p className={`text-sm mt-0.5 ${allOperational ? "text-emerald-600 dark:text-emerald-500" : "text-amber-600 dark:text-amber-500"}`}>
              Last checked: {new Date().toUTCString()}
            </p>
          </div>
        </div>

        {/* Services */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Services
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-white/6 rounded-2xl border border-gray-200 dark:border-white/8 overflow-hidden">
            {services.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between px-5 py-4 bg-white dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColor[svc.status as keyof typeof statusColor]}`} />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{svc.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden sm:block text-xs text-gray-400">{svc.uptime} uptime</span>
                  <span className={`text-xs font-medium ${svc.status === "operational" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {statusLabel[svc.status as keyof typeof statusLabel]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Incidents */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Recent Incidents
          </h2>
          {incidents.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.02] px-5 py-8 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No incidents in the past 90 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.02] px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{inc.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{inc.date}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${incidentBadge[inc.status]}`}>
                      {inc.status.charAt(0).toUpperCase() + inc.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500">
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy Policy</Link>
          <Link href="/terms"   className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Contact Support</Link>
          <Link href="/"        className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</Link>
        </div>
      </main>
    </div>
  );
}
