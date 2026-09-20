import type { RepoInspection } from "@/lib/repoIntelligence";

export type AbacusRepoAuditResult = {
  report: string;
  runId?: string;
};

function getWorkerUrl(): string | null {
  const explicit = process.env.ABACUS_REPO_WORKER_URL?.trim();
  if (explicit) return explicit;

  const legacy = process.env.ABACUS_WORKER_URL?.trim();
  if (!legacy) return null;

  try {
    const url = new URL(legacy);
    if (url.pathname.endsWith("/marketing")) url.pathname = url.pathname.replace(/\/marketing$/, "/repo-intelligence");
    else if (url.pathname === "/" || url.pathname === "") url.pathname = "/repo-intelligence";
    return url.toString();
  } catch {
    return null;
  }
}

export function isAbacusRepoWorkerConfigured(): boolean {
  return Boolean(getWorkerUrl());
}

export async function getAbacusRepoWorkerHealth(): Promise<{ configured: boolean; ok: boolean; service?: string }> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) return { configured: false, ok: false };

  try {
    const healthUrl = new URL(workerUrl);
    healthUrl.pathname = "/health";
    healthUrl.search = "";
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: process.env.ABACUS_WORKER_TOKEN
        ? { Authorization: "Bearer " + process.env.ABACUS_WORKER_TOKEN }
        : undefined,
    });
    if (!response.ok) return { configured: true, ok: false };
    const payload = await response.json() as { service?: string };
    return { configured: true, ok: true, service: payload.service };
  } catch {
    return { configured: true, ok: false };
  }
}

export async function runAbacusRepoAudit(input: {
  inspection: RepoInspection;
  context: string;
  focus?: string;
}): Promise<AbacusRepoAuditResult | null> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) return null;

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ABACUS_WORKER_TOKEN
          ? { Authorization: "Bearer " + process.env.ABACUS_WORKER_TOKEN }
          : {}),
      },
      body: JSON.stringify({
        job: "mansa-repo-intelligence",
        version: 1,
        repository: input.inspection.repository,
        treeSummary: {
          totalFiles: input.inspection.tree.totalFiles,
          topDirectories: input.inspection.tree.topDirectories,
        },
        focus: input.focus?.trim() || null,
        context: input.context,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      console.error("[abacus-repo] HTTP", response.status, await response.text().catch(() => ""));
      return null;
    }

    const payload = await response.json() as { report?: unknown; runId?: unknown };
    if (typeof payload.report !== "string" || payload.report.trim().length < 20) return null;

    return {
      report: payload.report.slice(0, 120000),
      runId: typeof payload.runId === "string" ? payload.runId : undefined,
    };
  } catch (error) {
    console.error("[abacus-repo] unavailable, using native fallback", error);
    return null;
  }
}
