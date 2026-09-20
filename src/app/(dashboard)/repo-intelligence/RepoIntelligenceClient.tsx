"use client";

import { useMemo, useState } from "react";

type RepoDetails = {
  owner: string;
  repo: string;
  github: string;
  diagram: string;
  ingest: string;
  editor: string;
};

function parseGitHubRepo(input: string): RepoDetails | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const normalised = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(normalised);

    if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    if (!owner || !repo) return null;

    const github = `https://github.com/${owner}/${repo}`;

    return {
      owner,
      repo,
      github,
      diagram: `https://gitdiagram.com/${owner}/${repo}`,
      ingest: `https://gitingest.com/${owner}/${repo}`,
      editor: `https://github.dev/${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

export default function RepoIntelligenceClient() {
  const [repoUrl, setRepoUrl] = useState(
    "https://github.com/Mansamusa1234/mansa-musa-aios"
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const repo = useMemo(() => parseGitHubRepo(repoUrl), [repoUrl]);

  const agentPrompt = useMemo(() => {
    if (!repo) return "";

    return [
      "Mansa Musa AI — Repo Intelligence briefing",
      "",
      `Repository: ${repo.github}`,
      `Architecture map: ${repo.diagram}`,
      `Agent-readable snapshot: ${repo.ingest}`,
      `Browser editor: ${repo.editor}`,
      "",
      "Analyse this codebase as a senior software architect and security-conscious debugging agent.",
      "Focus on:",
      "1. Application architecture, routes, services, data flow, and integrations.",
      "2. Broken or incomplete features and the smallest safe fixes.",
      "3. Deployment risks, environment-variable dependencies, auth boundaries, and security issues.",
      "4. Duplicate or dead code, maintainability problems, and performance bottlenecks.",
      "5. A prioritised implementation plan with exact files to inspect or change.",
      "",
      "Never request or expose API keys, tokens, passwords, .env contents, or other secrets.",
      "Treat third-party repository tools as untrusted until their requested permissions are verified.",
    ].join("\n");
  }, [repo]);

  async function copyPrompt() {
    if (!agentPrompt) return;
    try {
      await navigator.clipboard.writeText(agentPrompt);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  }

  const tools = repo
    ? [
        {
          title: "GitDiagram",
          subtitle: "Visual codebase architecture map",
          href: repo.diagram,
          action: "Open code map",
          note: "Best for understanding how folders, modules, and dependencies fit together.",
        },
        {
          title: "Gitingest",
          subtitle: "AI-readable repository snapshot",
          href: repo.ingest,
          action: "Create AI context",
          note: "Useful for giving an AI agent a consolidated view of a repository.",
        },
        {
          title: "github.dev",
          subtitle: "VS Code-style editor in the browser",
          href: repo.editor,
          action: "Open browser editor",
          note: "Fast editing and search. It is not a full runtime or terminal environment.",
        },
        {
          title: "GitHub",
          subtitle: "Original repository",
          href: repo.github,
          action: "Open repository",
          note: "Use GitHub for pull requests, issues, Actions, branches, and source history.",
        },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d1d]">
        <div className="border-b border-white/8 bg-gradient-to-r from-brand-500/15 via-transparent to-purple-500/10 p-6 md:p-8">
          <div className="mb-3 inline-flex items-center rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-300">
            Developer Intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Repo Intelligence
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Darren-neil, paste a GitHub repository once and Mansa Musa AI turns it
            into a visual architecture map, an AI-readable snapshot, a browser
            editor link, and an agent briefing prompt.
          </p>
        </div>

        <div className="p-6 md:p-8">
          <label
            htmlFor="repo-url"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400"
          >
            GitHub repository
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              id="repo-url"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/15"
            />
            <a
              href={repo?.github ?? "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!repo}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                repo
                  ? "bg-brand-500 text-white hover:bg-brand-400"
                  : "pointer-events-none bg-white/5 text-gray-600"
              }`}
            >
              Open repo
            </a>
          </div>
          {!repo && repoUrl.trim() && (
            <p className="mt-2 text-sm text-red-300">
              Enter a valid github.com/owner/repository URL.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-5 transition hover:border-brand-500/25"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">{tool.title}</h2>
                <p className="mt-1 text-sm text-brand-300">{tool.subtitle}</p>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Tool
              </span>
            </div>
            <p className="mt-4 min-h-10 text-sm leading-6 text-gray-400">{tool.note}</p>
            <a
              href={tool.href}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-gray-200 transition hover:border-brand-500/30 hover:bg-brand-500/10 hover:text-brand-200"
            >
              {tool.action} ↗
            </a>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#0d0d1d] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Send context to an AI agent</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-400">
              Copy this briefing into Mansa Musa AI Chat, AI Council, Claude,
              Gemini, Grok, or another authorised development agent.
            </p>
          </div>
          <button
            type="button"
            onClick={copyPrompt}
            disabled={!repo}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy failed"
                : "Copy agent briefing"}
          </button>
        </div>

        <pre className="mt-5 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-black/25 p-4 text-xs leading-5 text-gray-300">
          {agentPrompt || "Enter a valid GitHub repository to generate the briefing."}
        </pre>
      </section>

      <section className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-5">
        <h2 className="text-sm font-bold text-amber-200">Repository security</h2>
        <p className="mt-2 text-sm leading-6 text-amber-100/70">
          Never paste API keys, access tokens, passwords, private .env contents,
          Stripe secrets, Supabase service-role keys, or model-provider secrets
          into repository-analysis tools. For private repositories, inspect the
          exact permissions a third-party service requests before authorising it.
        </p>
      </section>
    </div>
  );
}
