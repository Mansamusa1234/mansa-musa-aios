"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Status = {
  abacus: { configured: boolean };
  aiGateway: { configured: boolean; modelRoutingConfigured: boolean };
  modelHub: { configured: boolean; providers: string[] };
  integrations: Array<{ id: string; label: string; configured: boolean }>;
  skills: Array<{ id: string; name: string; description: string; goalTemplate: string; contextHint: string; preferSupercomputer: boolean }>;
  liveDataConnectors: Array<{ key: string; name: string; category: string; configured: boolean; description: string }>;
  pendingApprovals: number;
};

type RunResponse = {
  ok: true;
  queuedActions: number;
  savedReportId: string | null;
  run: {
    goal: string;
    report: string;
    actions: Array<{ kind: string; target: string; title: string; description: string; risk: string }>;
    architecture: {
      abacusUsed: boolean;
      gatewayUsed: boolean;
      modelHubUsed: boolean;
      parallelTasks: number;
      liveConnectorsUsed: string[];
      connectorFailures: Array<{ key: string; error: string }>;
    };
    tasks: Array<{
      id: string;
      title: string;
      lane: string;
      result: {
        ok: boolean;
        engine: string;
        model?: string;
        provider?: string;
        durationMs: number;
        error?: string;
      };
    }>;
  };
};

function Dot({ on }: { on: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${on ? "bg-emerald-400" : "bg-amber-400"}`} />;
}

export default function OrchestratorClient() {
  const [goal, setGoal] = useState(
    "Audit the business stack, find the highest-leverage growth and automation opportunities, identify risks, and produce approval-ready actions.",
  );
  const [skillId, setSkillId] = useState("");
  const [context, setContext] = useState("");
  const [useSupercomputer, setUseSupercomputer] = useState(true);
  const [queueActions, setQueueActions] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orchestrator/status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) setStatus(data);
      })
      .catch(() => undefined);
  }, []);

  const connectedCount = useMemo(
    () => status?.integrations.filter((item) => item.configured).length ?? 0,
    [status],
  );

  async function run() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/orchestrator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          skillId: skillId || undefined,
          context,
          useSupercomputer,
          queueActions,
          saveReport: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Orchestration failed.");
      setResult(payload);
      fetch("/api/orchestrator/status")
        .then((res) => res.json())
        .then((data) => data?.ok && setStatus(data))
        .catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Orchestration failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <section className="overflow-hidden rounded-2xl border border-brand-500/20 bg-[#0d0d1d]">
        <div className="border-b border-white/8 bg-gradient-to-r from-brand-500/15 via-transparent to-purple-500/10 p-6 md:p-8">
          <div className="mb-3 inline-flex rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-300">
            Mansa Musa AI Control Plane
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Super Orchestrator</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-400">
            One goal becomes parallel specialist jobs. Heavy work can route to Abacus Supercomputer, model work can route through AI Gateway or the existing Model Hub, and consequential external writes are drafted into the Command Centre approval queue.
          </p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
          <article className="rounded-xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-2"><Dot on={Boolean(status?.abacus.configured)} /><span className="font-semibold text-white">Abacus Supercomputer</span></div>
            <p className="mt-2 text-xs text-gray-500">{status?.abacus.configured ? "Heavy-compute worker configured" : "Worker URL still needs configuring"}</p>
          </article>
          <article className="rounded-xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-2"><Dot on={Boolean(status?.aiGateway.configured || status?.modelHub.configured)} /><span className="font-semibold text-white">Model fabric</span></div>
            <p className="mt-2 text-xs text-gray-500">
              {status?.aiGateway.configured ? "AI Gateway ready" : status?.modelHub.configured ? `Model Hub: ${status.modelHub.providers.join(", ")}` : "No model provider configured"}
            </p>
          </article>
          <article className="rounded-xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center gap-2"><Dot on={connectedCount > 0} /><span className="font-semibold text-white">Business connections</span></div>
            <p className="mt-2 text-xs text-gray-500">{connectedCount} server-side integration{connectedCount === 1 ? "" : "s"} detected · {status?.pendingApprovals ?? 0} pending approvals</p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-6">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Reusable skills</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {status?.skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    setSkillId(skill.id);
                    setGoal(skill.goalTemplate);
                    setUseSupercomputer(skill.preferSupercomputer);
                  }}
                  title={skill.description}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    skillId === skill.id
                      ? "border-brand-500/50 bg-brand-500/15 text-brand-200"
                      : "border-white/8 bg-black/20 text-gray-400 hover:border-white/15 hover:text-gray-200"
                  }`}
                >
                  {skill.name}
                </button>
              ))}
            </div>
            {skillId ? (
              <p className="mt-2 text-xs text-gray-500">
                {status?.skills.find((skill) => skill.id === skillId)?.contextHint}
              </p>
            ) : null}
          </div>

          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Master goal</label>
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-brand-500/50"
          />

          <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-gray-500">Context / constraints</label>
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            rows={6}
            placeholder="Paste current business numbers, campaign context, technical constraints, brand rules, or anything the agents should use."
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-brand-500/50"
          />

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useSupercomputer} onChange={(event) => setUseSupercomputer(event.target.checked)} />
              Prefer Abacus for heavy jobs
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={queueActions} onChange={(event) => setQueueActions(event.target.checked)} />
              Queue consequential actions for approval
            </label>
          </div>

          {error ? <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">{error}</p> : null}

          <button
            type="button"
            onClick={run}
            disabled={running || goal.trim().length < 5}
            className="mt-6 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "Running parallel specialist jobs…" : "Run Super Orchestrator"}
          </button>
        </article>

        <aside className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-6">
          <h2 className="font-bold text-white">Connected stack</h2>
          <div className="mt-4 space-y-2">
            {status?.integrations.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-black/15 px-3 py-2 text-sm">
                <span className="text-gray-300">{item.label}</span>
                <span className={item.configured ? "text-emerald-300" : "text-gray-600"}>{item.configured ? "Configured" : "Not configured"}</span>
              </div>
            )) ?? <p className="text-sm text-gray-500">Loading integration status…</p>}
          </div>
          <div className="mt-6 border-t border-white/8 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Live data fabric</h3>
            <div className="mt-3 space-y-2">
              {status?.liveDataConnectors.map((connector) => (
                <div key={connector.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-gray-400">{connector.name}</span>
                  <span className={connector.configured ? "text-emerald-300" : "text-gray-600"}>
                    {connector.configured ? "Ready" : "Needs connection"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/command-centre" className="mt-5 inline-block text-sm font-semibold text-brand-300 hover:text-brand-200">
            Open approval queue →
          </Link>
        </aside>
      </section>

      {result ? (
        <>
          <section className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Execution map</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {result.run.architecture.parallelTasks} parallel jobs · {result.queuedActions} approval draft{result.queuedActions === 1 ? "" : "s"} queued
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {result.run.architecture.abacusUsed ? <span className="rounded-full bg-purple-500/15 px-3 py-1 font-bold text-purple-200">Abacus used</span> : null}
                {result.run.architecture.gatewayUsed ? <span className="rounded-full bg-cyan-500/15 px-3 py-1 font-bold text-cyan-200">AI Gateway used</span> : null}
                {result.run.architecture.modelHubUsed ? <span className="rounded-full bg-brand-500/15 px-3 py-1 font-bold text-brand-200">Model Hub used</span> : null}
                {result.run.architecture.liveConnectorsUsed.length ? (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-bold text-emerald-200">
                    {result.run.architecture.liveConnectorsUsed.length} live connector{result.run.architecture.liveConnectorsUsed.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {result.run.tasks.map((task) => (
                <article key={task.id} className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{task.lane}</div>
                  <div className="mt-1 font-semibold text-white">{task.title}</div>
                  <div className="mt-3 text-xs text-gray-400">{task.result.engine}{task.result.model ? ` · ${task.result.model}` : ""}</div>
                  <div className="mt-1 text-[11px] text-gray-600">{(task.result.durationMs / 1000).toFixed(1)}s</div>
                  {!task.result.ok ? <p className="mt-2 text-xs text-red-300">{task.result.error}</p> : null}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-500/20 bg-[#0d0d1d] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">Final synthesis</h2>
              {result.savedReportId ? <span className="text-xs text-emerald-300">Saved to reports</span> : null}
            </div>
            <pre className="mt-4 max-h-[900px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-black/25 p-5 text-sm leading-6 text-gray-200">{result.run.report}</pre>
            {result.run.actions.length ? (
              <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="font-bold text-amber-200">Approval-controlled actions</div>
                <p className="mt-1 text-sm text-amber-100/70">These are drafts only. Nothing external was executed by the orchestrator.</p>
                <Link href="/command-centre" className="mt-3 inline-block text-sm font-bold text-amber-200 underline">Review in Command Centre</Link>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
