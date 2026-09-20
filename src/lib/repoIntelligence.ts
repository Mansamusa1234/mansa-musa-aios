import { db } from "@/lib/db";

export type RepoInspection = {
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
  access: {
    authenticated: boolean;
    source: "oauth" | "server-token" | "anonymous";
  };
  languages: Record<string, number>;
  tree: {
    totalFiles: number;
    truncated: boolean;
    topDirectories: Array<{ name: string; files: number }>;
    paths: string[];
  };
  commits: Array<{
    sha: string;
    message: string;
    author: string | null;
    date: string | null;
    url: string;
  }>;
  pullRequests: Array<{
    number: number;
    title: string;
    author: string | null;
    draft: boolean;
    updatedAt: string;
    url: string;
  }>;
  workflows: Array<{
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    event: string;
    branch: string | null;
    sha: string;
    createdAt: string;
    url: string;
  }>;
  selectedFiles: Array<{
    path: string;
    content: string;
  }>;
};

type RepoApi = {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  pushed_at: string | null;
  owner: { login: string };
};

type TreeApi = {
  truncated: boolean;
  tree: Array<{ path: string; type: string; size?: number }>;
};

type CommitApi = {
  sha: string;
  html_url: string;
  author: { login?: string | null } | null;
  commit: {
    message: string;
    author: { name?: string | null; date?: string | null } | null;
  };
};

type PullApi = {
  number: number;
  title: string;
  html_url: string;
  draft?: boolean;
  updated_at: string;
  user: { login?: string | null } | null;
};

type RunApi = {
  workflow_runs?: Array<{
    id: number;
    name?: string | null;
    status: string;
    conclusion: string | null;
    event: string;
    head_branch: string | null;
    head_sha: string;
    created_at: string;
    html_url: string;
  }>;
};

type FileApi = {
  type: string;
  content?: string;
  encoding?: string;
  size?: number;
};

export function parseGitHubRepoUrl(input: string): { owner: string; repo: string } {
  const raw = input.trim();
  if (!raw) throw new Error("Repository URL is required.");

  const normalized = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
  const url = new URL(normalized);

  if (url.hostname.toLowerCase() !== "github.com" && url.hostname.toLowerCase() !== "www.github.com") {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Use a GitHub URL in the form github.com/owner/repository.");

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error("Invalid GitHub owner or repository name.");
  }

  return { owner, repo };
}

async function getGitHubToken(userId: string): Promise<{ token: string | null; source: "oauth" | "server-token" | "anonymous" }> {
  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (account?.access_token) return { token: account.access_token, source: "oauth" };
  if (process.env.GITHUB_REPO_TOKEN) return { token: process.env.GITHUB_REPO_TOKEN, source: "server-token" };
  return { token: null, source: "anonymous" };
}

async function githubJson<T>(url: string, token: string | null, retryAnonymous = true): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "MansaMusaAI-Repo-Intelligence",
  };
  if (token) headers.Authorization = "Bearer " + token;

  const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });

  if (response.status === 401 && token && retryAnonymous) {
    return githubJson<T>(url, null, false);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 404) {
      throw new Error("Repository not found or the connected GitHub account does not have access.");
    }
    if (response.status === 403) {
      throw new Error("GitHub rate limit or repository permission blocked this request.");
    }
    throw new Error("GitHub request failed (" + response.status + "): " + detail.slice(0, 240));
  }

  return response.json() as Promise<T>;
}

function isSensitivePath(path: string): boolean {
  return /(^|\/)(\.env($|\.)|\.npmrc$|\.pypirc$|id_rsa|id_ed25519|credentials?($|\.)|secrets?($|\/)|private[-_.]?key|.*\.(pem|p12|pfx|key)$)/i.test(path);
}

function redactPotentialSecrets(input: string): string {
  let text = input.replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, "[REDACTED PRIVATE KEY]");
  text = text.replace(/((?:api[_-]?key|secret|token|password|passwd|client[_-]?secret)\s*[:=]\s*)["'][^"'\r\n]{8,}["']/gi, "$1\"[REDACTED]\"");
  text = text.replace(/\b(ghp|github_pat|sk-[A-Za-z0-9_-]+|xai-[A-Za-z0-9_-]+)_[A-Za-z0-9_-]{16,}\b/g, "[REDACTED TOKEN]");
  return text;
}

function chooseKeyFiles(paths: string[]): string[] {
  const ranked = paths
    .filter((path) => !isSensitivePath(path))
    .map((path) => {
      const lower = path.toLowerCase();
      let score = 0;
      if (/^readme(\.|$)/i.test(path)) score += 120;
      if (lower === "package.json") score += 115;
      if (lower === "pyproject.toml" || lower === "requirements.txt" || lower === "go.mod" || lower === "cargo.toml") score += 110;
      if (lower === "dockerfile" || lower === "docker-compose.yml" || lower === "docker-compose.yaml") score += 105;
      if (lower === "vercel.json" || lower.startsWith("next.config.")) score += 100;
      if (lower === "tsconfig.json") score += 90;
      if (lower === "prisma/schema.prisma") score += 95;
      if (/^(src\/)?app\/.*(layout|page)\.(tsx|ts|jsx|js)$/.test(lower)) score += 50;
      if (/^(src\/)?lib\/.*(auth|router|config|client).*\.(ts|js)$/.test(lower)) score += 45;
      return { path, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.path.length - b.path.length);

  const selected: string[] = [];
  for (const item of ranked) {
    if (!selected.includes(item.path)) selected.push(item.path);
    if (selected.length >= 10) break;
  }
  return selected;
}

async function fetchTextFile(owner: string, repo: string, branch: string, path: string, token: string | null): Promise<string | null> {
  if (isSensitivePath(path)) return null;
  const apiUrl = "https://api.github.com/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(branch);
  const data = await githubJson<FileApi>(apiUrl, token);
  if (data.type !== "file" || !data.content || data.encoding !== "base64") return null;
  const decoded = Buffer.from(data.content.replace(/\s/g, ""), "base64").toString("utf8");
  return redactPotentialSecrets(decoded.slice(0, 18000));
}

export async function inspectGitHubRepo(userId: string, repoUrl: string): Promise<RepoInspection> {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);
  const access = await getGitHubToken(userId);
  const root = "https://api.github.com/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo);

  let metadata: RepoApi;
  try {
    metadata = await githubJson<RepoApi>(root, access.token);
  } catch (error) {
    if (access.token) metadata = await githubJson<RepoApi>(root, null, false);
    else throw error;
  }

  const effectiveToken = access.token;

  const [treeResult, languages, commits, pulls, runs] = await Promise.all([
    githubJson<TreeApi>(root + "/git/trees/" + encodeURIComponent(metadata.default_branch) + "?recursive=1", effectiveToken),
    githubJson<Record<string, number>>(root + "/languages", effectiveToken).catch(() => ({})),
    githubJson<CommitApi[]>(root + "/commits?per_page=8", effectiveToken).catch(() => []),
    githubJson<PullApi[]>(root + "/pulls?state=open&per_page=8&sort=updated&direction=desc", effectiveToken).catch(() => []),
    githubJson<RunApi>(root + "/actions/runs?per_page=8", effectiveToken).catch(() => ({ workflow_runs: [] })),
  ]);

  const filePaths = treeResult.tree
    .filter((entry) => entry.type === "blob" && !isSensitivePath(entry.path))
    .map((entry) => entry.path);

  const dirCounts = new Map<string, number>();
  for (const path of filePaths) {
    const first = path.includes("/") ? path.split("/")[0] : "(root)";
    dirCounts.set(first, (dirCounts.get(first) ?? 0) + 1);
  }

  const keyPaths = chooseKeyFiles(filePaths);
  const selectedFilesRaw = await Promise.all(
    keyPaths.map(async (path) => {
      try {
        const content = await fetchTextFile(owner, repo, metadata.default_branch, path, effectiveToken);
        return content ? { path, content } : null;
      } catch {
        return null;
      }
    })
  );

  return {
    repository: {
      owner: metadata.owner.login,
      name: metadata.name,
      fullName: metadata.full_name,
      description: metadata.description,
      defaultBranch: metadata.default_branch,
      private: metadata.private,
      htmlUrl: metadata.html_url,
      stars: metadata.stargazers_count,
      forks: metadata.forks_count,
      openIssues: metadata.open_issues_count,
      sizeKb: metadata.size,
      pushedAt: metadata.pushed_at,
    },
    access: {
      authenticated: Boolean(effectiveToken),
      source: effectiveToken ? access.source : "anonymous",
    },
    languages,
    tree: {
      totalFiles: filePaths.length,
      truncated: Boolean(treeResult.truncated),
      topDirectories: [...dirCounts.entries()]
        .map(([name, files]) => ({ name, files }))
        .sort((a, b) => b.files - a.files)
        .slice(0, 12),
      paths: filePaths.slice(0, 1500),
    },
    commits: commits.slice(0, 8).map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message.split("\n")[0].slice(0, 180),
      author: commit.author?.login ?? commit.commit.author?.name ?? null,
      date: commit.commit.author?.date ?? null,
      url: commit.html_url,
    })),
    pullRequests: pulls.slice(0, 8).map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.user?.login ?? null,
      draft: Boolean(pr.draft),
      updatedAt: pr.updated_at,
      url: pr.html_url,
    })),
    workflows: (runs.workflow_runs ?? []).slice(0, 8).map((run) => ({
      id: run.id,
      name: run.name ?? "Workflow",
      status: run.status,
      conclusion: run.conclusion,
      event: run.event,
      branch: run.head_branch,
      sha: run.head_sha,
      createdAt: run.created_at,
      url: run.html_url,
    })),
    selectedFiles: selectedFilesRaw.filter((item): item is { path: string; content: string } => Boolean(item)),
  };
}

export function buildRepoAuditContext(inspection: RepoInspection): string {
  const languageSummary = Object.entries(inspection.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => name + ": " + bytes)
    .join(", ");

  const lines = [
    "Repository: " + inspection.repository.fullName,
    "Description: " + (inspection.repository.description ?? "(none)"),
    "Default branch: " + inspection.repository.defaultBranch,
    "Private: " + String(inspection.repository.private),
    "Files: " + inspection.tree.totalFiles,
    "Languages: " + (languageSummary || "(unknown)"),
    "",
    "Top directories:",
    ...inspection.tree.topDirectories.map((item) => "- " + item.name + ": " + item.files + " files"),
    "",
    "Recent commits:",
    ...inspection.commits.map((item) => "- " + item.sha.slice(0, 8) + " " + item.message),
    "",
    "Open pull requests:",
    ...(inspection.pullRequests.length ? inspection.pullRequests.map((item) => "- #" + item.number + " " + item.title) : ["- none"]),
    "",
    "Recent workflows:",
    ...(inspection.workflows.length ? inspection.workflows.map((item) => "- " + item.name + ": " + item.status + "/" + (item.conclusion ?? "pending") + " on " + (item.branch ?? "unknown")) : ["- none"]),
    "",
    "Repository paths:",
    ...inspection.tree.paths.slice(0, 700).map((path) => "- " + path),
    "",
    "Selected source/configuration files:",
  ];

  let context = lines.join("\n");
  for (const file of inspection.selectedFiles) {
    const block = "\n\n===== " + file.path + " =====\n" + file.content;
    if (context.length + block.length > 78000) break;
    context += block;
  }

  return context.slice(0, 80000);
}
