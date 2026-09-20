export type RepoAnalysisInput = {
  repository: string;
  question?: string;
  context: Record<string, unknown>;
};

export type RepoAnalysisResult = {
  runId?: string;
  provider: "abacus";
  analysis: string;
};

export function isAbacusWorkerConfigured(): boolean {
  return Boolean(process.env.ABACUS_WORKER_URL);
}

function workerBase() {
  const configured = process.env.ABACUS_WORKER_URL?.trim();
  if (!configured) return null;
  return configured.replace(/\/marketing\/?$/, "").replace(/\/$/, "");
}

export async function runAbacusRepoWorker(
  input: RepoAnalysisInput
): Promise<RepoAnalysisResult | null> {
  const base = workerBase();
  if (!base) return null;

  try {
    const response = await fetch(`${base}/repo-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ABACUS_WORKER_TOKEN
          ? { Authorization: `Bearer ${process.env.ABACUS_WORKER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        job: "mansa-repo-intelligence",
        version: 1,
        ...input,
      }),
      signal: AbortSignal.timeout(90_000),
      cache: "no-store",
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      runId?: unknown;
      analysis?: unknown;
    };
    if (typeof data.analysis !== "string" || !data.analysis.trim()) return null;

    return {
      provider: "abacus",
      runId: typeof data.runId === "string" ? data.runId : undefined,
      analysis: data.analysis,
    };
  } catch (error) {
    console.error("[abacus-worker] repo analysis unavailable", error);
    return null;
  }
}
