"use client";

import { useState } from "react";

interface ConnectorInfo {
  key: string;
  name: string;
  category: string;
  description: string;
  configured: boolean;
  notConfiguredReason?: string;
}

interface TestResult {
  ok: boolean;
  summary: string;
}

export default function ConnectorsClient({ connectors }: { connectors: ConnectorInfo[] }) {
  const [results, setResults] = useState<Record<string, TestResult | undefined>>({});
  const [testing, setTesting] = useState<string | null>(null);

  async function test(key: string) {
    setTesting(key);
    try {
      const res = await fetch(`/api/admin/connectors/${key}/test`, { method: "POST" });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [key]: data }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [key]: { ok: false, summary: String(err) } }));
    } finally {
      setTesting(null);
    }
  }

  const byCategory = connectors.reduce<Record<string, ConnectorInfo[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Live Data Connectors</h1>
      <p className="mt-1 text-sm text-gray-500">
        Infrastructure for connecting agents to external data sources. Connectors needing credentials are marked
        not configured — nothing fakes a live connection.
      </p>

      <div className="mt-6 space-y-8">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-600">{category}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((c) => {
                const result = results[c.key];
                const stripeTestsDisabled = c.key === "stripe";
                return (
                  <div key={c.key} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white">{c.name}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{c.description}</p>
                      </div>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.configured ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"
                        }`}
                      >
                        {c.configured ? "Connected" : "Not configured"}
                      </span>
                    </div>

                    {!c.configured && c.notConfiguredReason && (
                      <p className="mt-2 text-[11px] text-gray-600">{c.notConfiguredReason}</p>
                    )}

                    <button
                      onClick={() => test(c.key)}
                      disabled={testing === c.key || stripeTestsDisabled}
                      className="mt-3 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/8 disabled:opacity-50 transition-colors"
                    >
                      {stripeTestsDisabled ? "Testing disabled" : testing === c.key ? "Testing…" : "Test connection"}
                    </button>

                    {result && (
                      <div
                        className={`mt-2 rounded-lg border p-2 text-[11px] ${
                          result.ok ? "border-green-500/20 bg-green-500/5 text-green-300" : "border-gray-500/20 bg-gray-500/5 text-gray-400"
                        }`}
                      >
                        {result.summary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
