import type { Metadata } from "next";
import { getHospitalIncidents, hospitalIsConfigured } from "@/lib/hospital";

export const metadata: Metadata = { title: "AI Hospital | Admin" };
export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  OPEN: "bg-amber-500/15 text-amber-400",
  RETRYING: "bg-blue-500/15 text-blue-400",
  RECOVERED: "bg-green-500/15 text-green-400",
  ESCALATED: "bg-red-500/15 text-red-400",
};

export default async function HospitalPage() {
  const configured = hospitalIsConfigured();
  const incidents = await getHospitalIncidents(50);
  const open = incidents.filter((item) => item.status === "OPEN" || item.status === "RETRYING").length;
  const recovered = incidents.filter((item) => item.status === "RECOVERED").length;
  const escalated = incidents.filter((item) => item.status === "ESCALATED").length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">· Recovery Centre ·</p>
        <h1 className="text-2xl font-extrabold text-white">AI Hospital</h1>
        <p className="mt-1 text-sm text-gray-500">
          Failed jobs are captured, diagnosed, retried with backoff, and escalated after three attempts.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open", value: open, color: "text-amber-400" },
          { label: "Recovered", value: recovered, color: "text-green-400" },
          { label: "Escalated", value: escalated, color: "text-red-400" },
          { label: "Storage", value: configured ? "Online" : "Not configured", color: configured ? "text-green-400" : "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
        <div className="border-b border-white/6 px-4 py-3">
          <h2 className="text-sm font-bold text-white">Recent incidents</h2>
          <p className="text-[11px] text-gray-600 mt-0.5">Automatic recovery is bounded to one safe retry per daily audit to control costs.</p>
        </div>
        {incidents.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-2xl">♥</p>
            <p className="mt-2 text-sm font-semibold text-green-400">No incidents recorded</p>
            <p className="mt-1 text-xs text-gray-600">The recovery queue is clear.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/6 text-left text-gray-500">
                  <th className="py-3 pl-4 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Source</th>
                  <th className="py-3 px-3 font-semibold">Failure</th>
                  <th className="py-3 px-3 font-semibold">Attempts</th>
                  <th className="py-3 pr-4 text-right font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-b border-white/4 align-top">
                    <td className="py-3 pl-4">
                      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusStyle[incident.status] ?? statusStyle.OPEN}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-300">{incident.source}</p>
                      <p className="mt-1 max-w-xs truncate font-mono text-[10px] text-gray-600">{incident.operation}</p>
                    </td>
                    <td className="py-3 px-3 max-w-md text-gray-400">{incident.message}</td>
                    <td className="py-3 px-3 text-gray-500">{incident.attempts}/{incident.maxAttempts}</td>
                    <td className="py-3 pr-4 text-right text-gray-600 whitespace-nowrap">
                      {new Date(incident.lastSeenAt).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
