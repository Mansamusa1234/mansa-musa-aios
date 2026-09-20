"use client";

import { useMemo, useState } from "react";

type Inspection = {
  repository: {
    owner: string;
    name: string;
    fullName: string;
    description: string | null;
    defaultBranch: string;
    private: boolean;
    htmlUrl: string;
    stars: number;
    forks: number;
    openIssues: number;
    sizeKb: number;
    pushedAt: string | null;
  };
  access: { authenticated: boolean; source: string };
  languages: Record<string, number>;
  tree: {
    totalFiles: number;
    truncated: boolean;
    topDirectories: Array<{ name: string; files: number }>;
    paths: string[];
  };
  commits: Array<{ sha: string; message: string; author: string | null; date: string | null; url: string }>;
  pullRequests: Array<{ number: number; title: string; author: string | null; draft: boolean; updatedAt: string; url: string }>;
  workflows: Array<{ id: number; name: string; status: string; conclusion: string | null; event: string; branch: string | null; sha: string; createdAt: string; url: string }>;
  selectedFiles: Array<{ path: string; content: string }>;
};

type Infrastructure = {
  github: { connected: boolean; accessSource: string; privateRepository: boolean };
  abacus: { configured: boolean; ok: boolean; service?: string };
  vercel: {
    configured: boolean;
    current: { environment: string | null; branch: string | null; commitSha: string | null; url: string | null };
    latest: Array<{ id: string; url: string; state: string; target: string | null; createdAt: number | null; branch: string | null; commitSha: string | null }>;
  };
};

type InspectResponse = { ok: true; inspection: Inspection; infrastructure: Infrastructure };
type AuditResponse = { ok: true; source: string; model?: string; runId?: string | null; report: string; repository: Inspection["repository"] };

function parseRepo(input: string) {
  try {
    const raw = input.trim();
    if (!raw) return null;
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    return {
      owner,
      repo,
      github: "https://github.com/" + owner + "/" + repo,
      diagram: "https://gitdiagram.com/" + owner + "/" + repo,
      ingest: "https://gitingest.com/" + owner + "/" + repo,
      editor: "https://github.dev/" + owner + "/" + repo,
    };
  } catch {
    return null;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as { error?: string } & Partial<T>;
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload as T;
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={"inline-block h-2.5 w-2.5 rounded-full " + (ok ? "bg-emerald-400" : "bg-amber-400")} />;
}

function dateLabel(input: string | number | null) {
  if (!input) return "Unknown";
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function RepoIntelligenceClient() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/Mansamusa1234/mansa-musa-aios");
  const [focus, setFocus] = useState("Find broken routes, deployment failures, authentication risks, incomplete integrations and the smallest safe fixes.");
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [infrastructure, setInfrastructure] = useState<Infrastructure | null>(null);
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const repo = useMemo(() => parseRepo(repoUrl), [repoUrl]);

  const languageEntries = useMemo(() => {
    if (!inspection) return [];
    return Object.entries(inspection.languages).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [inspection]);

  async function inspectRepo() {
    setLoadingInspect(true);
    setError("");
    setAudit(null);
    setSavedMessage("");
    try {
      const response = await fetch("/api/repo-intelligence/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const payload = await readJson<InspectResponse>(response);
      setInspection(payload.inspection);
      setInfrastructure(payload.infrastructure);
    } catch (err) {
      setInspection(null);
      setInfrastructure(null);
      setError(err instanceof Error ? err.message : "Inspection failed.");
    } finally {
      setLoadingInspect(false);
    }
  }

  async function runAudit() {
    setLoadingAudit(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch("/api/repo-intelligence/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, focus }),
      });
      const payload = await readJson<AuditResponse>(response);
      setAudit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setLoadingAudit(false);
    }
  }

  async function saveAudit() {
    if (!audit) return;
    setSaving(true);
    setSavedMessage("");
    setError("");
    try {
      const response = await fetch("/api/repo-intelligence/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, report: audit.report, source: audit.source }),
      });
      const payload = await readJson<{ ok: true; saved: { title: string } }>(response);
      setSavedMessage("Saved: " + payload.saved.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save report.");
    } finally {
      setSaving(false);
    }
  }

  async function copyReport() {
    if (!audit) return;
    await navigator.clipboard.writeText(audit.report).catch(() => undefined);
  }

  const tools = repo ? [
    { title: "GitDiagram", text: "Interactive architecture map", href: repo.diagram },
    { title: "Gitingest", text: "Agent-readable code snapshot", href: repo.ingest },
    { title: "github.dev", text: "VS Code-style browser editor", href: repo.editor },
    { title: "GitHub", text: "Repository source, PRs and Actions", href: repo.github },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d1d]">
        <div className="border-b border-white/8 bg-gradient-to-r from-brand-500/15 via-transparent to-purple-500/10 p-6 md:p-8">
          <div className="mb-3 inline-flex items-center rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-300">
            Admin Developer Control Centre
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Repo Intelligence</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-400">
            GitHub source intelligence, Vercel deployment visibility, Abacus Supercomputer audits and Mansa Musa AI fallback reasoning in one stack.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <label htmlFor="repo-url" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">GitHub repository</label>
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              id="repo-url"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500/60"
              placeholder="https://github.com/owner/repository"
            />
            <button
              type="button"
              onClick={inspectRepo}
              disabled={!repo || loadingInspect}
              className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loadingInspect ? "Inspecting…" : "Inspect repository"}
            </button>
          </div>
          {!repo && repoUrl.trim() ? <p className="mt-2 text-sm text-red-300">Enter a valid github.com/owner/repository URL.</p> : null}
          {error ? <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {tools.map((tool) => (
          <a key={tool.title} href={tool.href} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5 transition hover:border-brand-500/30 hover:bg-brand-500/5">
            <div className="text-base font-bold text-white">{tool.title}</div>
            <div className="mt-1 text-sm text-gray-400">{tool.text}</div>
            <div className="mt-4 text-xs font-bold text-brand-300">Open ↗</div>
          </a>
        ))}
      </section>

      {infrastructure ? (
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
            <div className="flex items-center gap-2"><StatusDot ok={true} /><h2 className="font-bold text-white">GitHub</h2></div>
            <p className="mt-3 text-sm text-gray-400">
              Access: {infrastructure.github.connected ? infrastructure.github.accessSource : "anonymous/public"}
            </p>
            <p className="mt-1 text-xs text-gray-500">{infrastructure.github.privateRepository ? "Private repository" : "Public repository"}</p>
          </article>

          <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
            <div className="flex items-center gap-2"><StatusDot ok={infrastructure.abacus.ok} /><h2 className="font-bold text-white">Abacus Supercomputer</h2></div>
            <p className="mt-3 text-sm text-gray-400">
              {!infrastructure.abacus.configured ? "Worker endpoint not configured" : infrastructure.abacus.ok ? "Worker online" : "Configured but unreachable"}
            </p>
            <p className="mt-1 text-xs text-gray-500">{infrastructure.abacus.service || "Heavy compute / full audits"}</p>
          </article>

          <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
            <div className="flex items-center gap-2"><StatusDot ok={Boolean(infrastructure.vercel.current.url)} /><h2 className="font-bold text-white">Vercel</h2></div>
            <p className="mt-3 text-sm text-gray-400">
              {infrastructure.vercel.current.environment || "Runtime detected when deployed"}
            </p>
            <p className="mt-1 truncate text-xs text-gray-500">
              {infrastructure.vercel.current.branch || "No branch metadata"}
              {infrastructure.vercel.current.commitSha ? " · " + infrastructure.vercel.current.commitSha.slice(0, 8) : ""}
            </p>
          </article>
        </section>
      ) : null}

      {inspection ? (
        <>
          <section className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{inspection.repository.fullName}</h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-400">{inspection.repository.description || "No repository description."}</p>
              </div>
              <a href={inspection.repository.htmlUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-300 hover:text-brand-200">View on GitHub ↗</a>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Files", String(inspection.tree.totalFiles)],
                ["Branch", inspection.repository.defaultBranch],
                ["Stars", String(inspection.repository.stars)],
                ["Forks", String(inspection.repository.forks)],
                ["Open issues", String(inspection.repository.openIssues)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
                  <div className="mt-1 truncate text-lg font-bold text-white">{value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
              <h3 className="font-bold text-white">Languages</h3>
              <div className="mt-4 space-y-2">
                {languageEntries.length ? languageEntries.map(([name, bytes]) => (
                  <div key={name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-300">{name}</span>
                    <span className="text-gray-500">{bytes.toLocaleString()} bytes</span>
                  </div>
                )) : <p className="text-sm text-gray-500">No language data.</p>}
              </div>
            </article>

            <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
              <h3 className="font-bold text-white">Top directories</h3>
              <div className="mt-4 space-y-2">
                {inspection.tree.topDirectories.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-gray-300">{item.name}</span>
                    <span className="text-gray-500">{item.files} files</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
              <h3 className="font-bold text-white">Key files loaded safely</h3>
              <div className="mt-4 space-y-2">
                {inspection.selectedFiles.length ? inspection.selectedFiles.map((file) => (
                  <div key={file.path} className="truncate text-sm text-gray-300">{file.path}</div>
                )) : <p className="text-sm text-gray-500">No key files loaded.</p>}
              </div>
              <p className="mt-4 text-xs leading-5 text-gray-500">Sensitive paths are excluded and probable credentials are redacted before AI analysis.</p>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
              <h3 className="font-bold text-white">Recent commits</h3>
              <div className="mt-4 space-y-3">
                {inspection.commits.length ? inspection.commits.map((commit) => (
                  <a key={commit.sha} href={commit.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-white/6 bg-black/15 p-3 hover:border-brand-500/20">
                    <div className="text-xs font-bold text-brand-300">{commit.sha.slice(0, 8)}</div>
                    <div className="mt-1 text-sm text-gray-300">{commit.message}</div>
                    <div className="mt-1 text-[11px] text-gray-500">{commit.author || "unknown"} · {dateLabel(commit.date)}</div>
                  </a>
                )) : <p className="text-sm text-gray-500">No commit data.</p>}
              </div>
            </article>

            <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
              <h3 className="font-bold text-white">Open pull requests</h3>
              <div className="mt-4 space-y-3">
                {inspection.pullRequests.length ? inspection.pullRequests.map((pr) => (
                  <a key={pr.number} href={pr.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-white/6 bg-black/15 p-3 hover:border-brand-500/20">
                    <div className="text-xs font-bold text-brand-300">#{pr.number}{pr.draft ? " · Draft" : ""}</div>
                    <div className="mt-1 text-sm text-gray-300">{pr.title}</div>
                    <div className="mt-1 text-[11px] text-gray-500">{pr.author || "unknown"} · {dateLabel(pr.updatedAt)}</div>
                  </a>
                )) : <p className="text-sm text-gray-500">No open pull requests.</p>}
              </div>
            </article>

            <article className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
              <h3 className="font-bold text-white">GitHub Actions</h3>
              <div className="mt-4 space-y-3">
                {inspection.workflows.length ? inspection.workflows.map((run) => (
                  <a key={run.id} href={run.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-white/6 bg-black/15 p-3 hover:border-brand-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-300">{run.name}</span>
                      <span className="text-[10px] font-bold uppercase text-gray-500">{run.conclusion || run.status}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">{run.branch || "unknown branch"} · {run.event}</div>
                  </a>
                )) : <p className="text-sm text-gray-500">No workflow runs returned.</p>}
              </div>
            </article>
          </section>

          {infrastructure?.vercel.latest.length ? (
            <section className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5">
              <h3 className="font-bold text-white">Recent Vercel deployments</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {infrastructure.vercel.latest.map((deployment) => (
                  <a key={deployment.id} href={deployment.url || "#"} target="_blank" rel="noreferrer" className="rounded-xl border border-white/6 bg-black/15 p-4 hover:border-brand-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-gray-200">{deployment.state}</span>
                      <span className="text-[10px] uppercase text-gray-500">{deployment.target || "preview"}</span>
                    </div>
                    <div className="mt-2 truncate text-xs text-gray-400">{deployment.branch || "unknown branch"}</div>
                    <div className="mt-1 text-[11px] text-gray-500">{deployment.commitSha ? deployment.commitSha.slice(0, 8) : "no commit"} · {dateLabel(deployment.createdAt)}</div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-brand-500/20 bg-[#0d0d1d] p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Full codebase audit</h2>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Abacus Supercomputer is used first when online. If it is unavailable, Mansa Musa AI automatically falls back to an available configured model.
                </p>
                <label htmlFor="audit-focus" className="mt-4 block text-xs font-bold uppercase tracking-wider text-gray-500">Audit focus</label>
                <textarea
                  id="audit-focus"
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-brand-500/50"
                />
              </div>
              <button
                type="button"
                onClick={runAudit}
                disabled={loadingAudit}
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-400 disabled:opacity-40"
              >
                {loadingAudit ? "Running full audit…" : "Run full audit"}
              </button>
            </div>

            {audit ? (
              <div className="mt-6">
                <div className="flex flex-col gap-3 border-b border-white/8 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-300">Source: {audit.source}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {audit.model ? "Model: " + audit.model : "Abacus run: " + (audit.runId || "completed")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={copyReport} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-200">Copy</button>
                    <button type="button" onClick={saveAudit} disabled={saving} className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-200 disabled:opacity-40">{saving ? "Saving…" : "Save report"}</button>
                  </div>
                </div>
                {savedMessage ? <p className="mt-3 text-sm text-emerald-300">{savedMessage}</p> : null}
                <pre className="mt-4 max-h-[800px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-black/25 p-5 text-sm leading-6 text-gray-200">{audit.report}</pre>
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-white/10 bg-[#0d0d1d] p-8 text-center">
          <p className="text-sm text-gray-400">Inspect a repository to load live GitHub, Vercel and Abacus intelligence.</p>
        </section>
      )}

      <section className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-5">
        <h2 className="text-sm font-bold text-amber-200">Security boundary</h2>
        <p className="mt-2 text-sm leading-6 text-amber-100/70">
          This developer control centre is admin-only. Sensitive repository paths are excluded before analysis, likely credentials are redacted, and GitHub/Vercel/Abacus tokens remain server-side.
        </p>
      </section>
    </div>
  );
}
