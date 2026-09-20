import { db } from "@/lib/db";

type GitHubRequestOptions = {
  userId: string;
  path: string;
};

async function githubTokenForUser(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  return account?.access_token ?? process.env.GITHUB_REPO_TOKEN ?? null;
}

export async function githubRequest<T>({ userId, path }: GitHubRequestOptions): Promise<T> {
  const token = await githubTokenForUser(userId);
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response.json() as Promise<T>;
}

export function parseRepoUrl(input: string) {
  const normalised = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(normalised);
  if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
    throw new Error("Only github.com repositories are supported");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Repository URL must include owner and repository");
  return { owner: parts[0], repo: parts[1].replace(/\.git$/i, "") };
}

type Repo = {
  full_name: string;
  private: boolean;
  default_branch: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  pushed_at: string;
  html_url: string;
};

type Branch = { name: string; commit: { sha: string } };
type Commit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author?: { login?: string } | null;
};
type Pull = {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  html_url: string;
  user?: { login?: string } | null;
  updated_at: string;
};
type Tree = {
  tree: Array<{ path: string; type: "blob" | "tree"; size?: number; sha: string }>;
  truncated: boolean;
};
type Status = {
  state: string;
  statuses: Array<{ context: string; state: string; target_url?: string; description?: string }>;
};

export async function inspectGitHubRepo(userId: string, repoUrl: string) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const base = `/repos/${owner}/${repo}`;

  const repository = await githubRequest<Repo>({ userId, path: base });
  const branchName = repository.default_branch;

  const [branches, commits, pulls, tree] = await Promise.all([
    githubRequest<Branch[]>({ userId, path: `${base}/branches?per_page=12` }),
    githubRequest<Commit[]>({ userId, path: `${base}/commits?per_page=8` }),
    githubRequest<Pull[]>({ userId, path: `${base}/pulls?state=open&per_page=8&sort=updated` }),
    githubRequest<Tree>({
      userId,
      path: `${base}/git/trees/${encodeURIComponent(branchName)}?recursive=1`,
    }),
  ]);

  const latestSha = commits[0]?.sha;
  let status: Status | null = null;
  if (latestSha) {
    status = await githubRequest<Status>({
      userId,
      path: `${base}/commits/${latestSha}/status`,
    }).catch(() => null);
  }

  const files = tree.tree.filter((item) => item.type === "blob");
  const directories = tree.tree.filter((item) => item.type === "tree");
  const extensionCounts = new Map<string, number>();
  for (const file of files) {
    const name = file.path.split("/").pop() ?? "";
    const idx = name.lastIndexOf(".");
    const ext = idx > 0 ? name.slice(idx + 1).toLowerCase() : "(none)";
    extensionCounts.set(ext, (extensionCounts.get(ext) ?? 0) + 1);
  }

  const languages = [...extensionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([extension, count]) => ({ extension, count }));

  const importantFiles = files
    .filter((file) =>
      /(^|\/)(package\.json|pyproject\.toml|requirements\.txt|Dockerfile|docker-compose\.ya?ml|vercel\.json|next\.config\.[^/]+|README\.md|prisma\/schema\.prisma|\.github\/workflows\/[^/]+)$/i.test(file.path)
    )
    .slice(0, 30)
    .map((file) => file.path);

  return {
    repository,
    branches: branches.map((b) => ({ name: b.name, sha: b.commit.sha })),
    commits: commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0],
      author: c.author?.login ?? c.commit.author?.name ?? "unknown",
      date: c.commit.author?.date ?? null,
      url: c.html_url,
    })),
    pulls: pulls.map((p) => ({
      number: p.number,
      title: p.title,
      state: p.state,
      draft: p.draft,
      author: p.user?.login ?? "unknown",
      updatedAt: p.updated_at,
      url: p.html_url,
    })),
    status,
    tree: {
      truncated: tree.truncated,
      fileCount: files.length,
      directoryCount: directories.length,
      languages,
      importantFiles,
      samplePaths: files.slice(0, 120).map((file) => file.path),
    },
  };
}
