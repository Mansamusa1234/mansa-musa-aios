export type VercelRepoStatus = {
  configured: boolean;
  current: {
    environment: string | null;
    branch: string | null;
    commitSha: string | null;
    url: string | null;
  };
  latest: Array<{
    id: string;
    url: string;
    state: string;
    target: string | null;
    createdAt: number | null;
    branch: string | null;
    commitSha: string | null;
  }>;
};

type VercelApi = {
  deployments?: Array<{
    uid?: string;
    id?: string;
    url?: string;
    state?: string;
    readyState?: string;
    target?: string | null;
    created?: number;
    createdAt?: number;
    meta?: {
      githubCommitRef?: string;
      githubCommitSha?: string;
    };
  }>;
};

export async function getVercelRepoStatus(): Promise<VercelRepoStatus> {
  const current = {
    environment: process.env.VERCEL_ENV ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    url: process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : null,
  };

  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return { configured: false, current, latest: [] };

  try {
    const query = new URLSearchParams({ projectId, limit: "6" });
    if (teamId) query.set("teamId", teamId);
    const response = await fetch("https://api.vercel.com/v6/deployments?" + query.toString(), {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { configured: true, current, latest: [] };

    const payload = await response.json() as VercelApi;
    const latest = (payload.deployments ?? []).slice(0, 6).map((deployment) => ({
      id: deployment.uid ?? deployment.id ?? "",
      url: deployment.url ? "https://" + deployment.url : "",
      state: deployment.readyState ?? deployment.state ?? "UNKNOWN",
      target: deployment.target ?? null,
      createdAt: deployment.createdAt ?? deployment.created ?? null,
      branch: deployment.meta?.githubCommitRef ?? null,
      commitSha: deployment.meta?.githubCommitSha ?? null,
    }));

    return { configured: true, current, latest };
  } catch {
    return { configured: true, current, latest: [] };
  }
}
