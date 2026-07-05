import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MODEL_CATALOG } from "@/lib/modelRouter";

export const metadata: Metadata = { title: "Model Hub Admin | MansaMusaAI" };
export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [usageByProvider, usageByModel, totalCost, recentUsage] = await Promise.all([
    db.usageRecord.groupBy({
      by: ["provider"],
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true, costUsdMicro: true },
      where: { createdAt: { gte: monthStart } },
      orderBy: { _count: { id: "desc" } },
    }),
    db.usageRecord.groupBy({
      by: ["model", "provider"],
      _count: { id: true },
      _sum: { inputTokens: true, outputTokens: true, costUsdMicro: true },
      where: { createdAt: { gte: monthStart } },
      orderBy: { _count: { id: "desc" } },
    }),
    db.usageRecord.aggregate({
      _sum: { costUsdMicro: true },
      where: { createdAt: { gte: monthStart } },
    }),
    db.usageRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const totalCostUsd = ((totalCost._sum.costUsdMicro ?? 0) / 1_000_000).toFixed(4);

  const PROVIDER_KEYS: Record<string, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    grok: "XAI_API_KEY",
    gemini: "GOOGLE_AI_API_KEY",
    mistral: "MISTRAL_API_KEY",
  };

  const keyStatus = Object.entries(PROVIDER_KEYS).map(([provider, envKey]) => ({
    provider,
    envKey,
    configured: !!process.env[envKey],
  }));

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">· Admin ·</p>
        <h1 className="text-2xl font-extrabold text-white">Model Hub Management</h1>
        <p className="mt-1 text-sm text-gray-500">API key status, cost tracking, and usage analytics.</p>
      </div>

      <section>
        <h2 className="text-sm font-bold text-white mb-3">API Key Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {keyStatus.map(({ provider, envKey, configured }) => (
            <div key={provider} className={`rounded-2xl border p-4 ${configured ? "border-green-500/20 bg-green-500/5" : "border-white/8 bg-white/3"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${configured ? "text-green-400" : "text-gray-600"}`}>{provider}</p>
              <p className={`mt-1.5 text-[10px] font-mono ${configured ? "text-green-400" : "text-gray-600"}`}>{configured ? "✓ Configured" : "Not set"}</p>
              <p className="text-[9px] text-gray-700 mt-0.5 font-mono">{envKey}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-600 mt-2">Set API keys in Vercel Dashboard → Environment Variables.</p>
      </section>

      <section>
        <h2 className="text-sm font-bold text-white mb-3">This month&apos;s costs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-2xl font-extrabold text-white">${totalCostUsd}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Total cost (USD)</p>
          </div>
          {usageByProvider.slice(0, 3).map((p) => (
            <div key={p.provider} className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-xl font-extrabold text-white">{p._count.id}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{p.provider} calls</p>
              <p className="text-[9px] text-gray-700">${((p._sum.costUsdMicro ?? 0) / 1_000_000).toFixed(4)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-white mb-3">Usage by model (this month)</h2>
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/6">
                <th className="py-3 pl-4 text-left text-gray-500 font-semibold">Model</th>
                <th className="py-3 px-3 text-left text-gray-500 font-semibold hidden sm:table-cell">Provider</th>
                <th className="py-3 px-3 text-right text-gray-500 font-semibold">Calls</th>
                <th className="py-3 px-3 text-right text-gray-500 font-semibold hidden md:table-cell">Tokens</th>
                <th className="py-3 pr-4 text-right text-gray-500 font-semibold">Cost</th>
              </tr>
            </thead>
            <tbody>
              {usageByModel.map((row) => {
                const def = MODEL_CATALOG.find((m) => m.modelId === row.model);
                return (
                  <tr key={`${row.provider}-${row.model}`} className="border-b border-white/4 hover:bg-white/2">
                    <td className="py-2.5 pl-4 font-mono text-gray-300">{def?.displayName ?? row.model}</td>
                    <td className="py-2.5 px-3 text-gray-500 hidden sm:table-cell capitalize">{row.provider}</td>
                    <td className="py-2.5 px-3 text-right text-gray-300">{row._count.id}</td>
                    <td className="py-2.5 px-3 text-right text-gray-500 hidden md:table-cell">{((row._sum.inputTokens ?? 0) + (row._sum.outputTokens ?? 0)).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-300">${((row._sum.costUsdMicro ?? 0) / 1_000_000).toFixed(4)}</td>
                  </tr>
                );
              })}
              {usageByModel.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-600">No usage this month</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-white mb-3">Recent model calls</h2>
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/6">
                <th className="py-3 pl-4 text-left text-gray-500 font-semibold">Model</th>
                <th className="py-3 px-3 text-left text-gray-500 font-semibold hidden sm:table-cell">User</th>
                <th className="py-3 px-3 text-right text-gray-500 font-semibold hidden md:table-cell">Tokens</th>
                <th className="py-3 pr-4 text-right text-gray-500 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentUsage.map((r) => (
                <tr key={r.id} className="border-b border-white/4 hover:bg-white/2">
                  <td className="py-2.5 pl-4 text-gray-300 font-mono">{r.model}</td>
                  <td className="py-2.5 px-3 text-gray-500 hidden sm:table-cell">{r.user.email}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500 hidden md:table-cell">{((r.inputTokens ?? 0) + (r.outputTokens ?? 0)).toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-600">{new Date(r.createdAt).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-white mb-3">Available models ({MODEL_CATALOG.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODEL_CATALOG.map((m) => (
            <div key={`${m.provider}-${m.modelId}`} className="rounded-xl border border-white/8 bg-white/2 p-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">{m.displayName}</p>
                <p className="text-[10px] text-gray-500 capitalize">{m.provider} · {m.planGate}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.available() ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-600"}`}>
                {m.available() ? "Active" : "No key"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
