export type MarketGapResearchInput = {
  projectName: string;
  idea: string;
  customers: string;
  problem: string;
  market?: string;
  goal?: string;
  keywords?: string[];
  context?: string;
};

export type MarketGapResearchResult = {
  report: string;
  runId?: string;
  liveSearch: boolean;
  source: string;
  warning?: string;
};

function getWorkerUrl(): string | null {
  const explicit = process.env.ABACUS_MARKET_GAP_WORKER_URL?.trim();
  if (explicit) return explicit;

  const legacy = process.env.ABACUS_WORKER_URL?.trim();
  if (!legacy) return null;

  try {
    const url = new URL(legacy);
    if (url.pathname.endsWith("/marketing")) {
      url.pathname = url.pathname.replace(/\/marketing$/, "/market-gap");
    } else if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/market-gap";
    } else {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isAbacusMarketGapWorkerConfigured(): boolean {
  return Boolean(getWorkerUrl());
}

export async function runAbacusMarketGapResearch(
  input: MarketGapResearchInput
): Promise<MarketGapResearchResult | null> {
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
        job: "mansa-market-gap",
        version: 1,
        projectName: input.projectName,
        idea: input.idea,
        customers: input.customers,
        problem: input.problem,
        market: input.market?.trim() || "Global",
        goal: input.goal?.trim() || "Find the strongest commercially testable market gap",
        keywords: input.keywords ?? [],
        context: input.context?.trim() || null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(190000),
    });

    if (!response.ok) {
      console.error("[abacus-market-gap] HTTP", response.status, await response.text().catch(() => ""));
      return null;
    }

    const payload = await response.json() as {
      report?: unknown;
      runId?: unknown;
      liveSearch?: unknown;
      source?: unknown;
      warning?: unknown;
    };

    if (typeof payload.report !== "string" || payload.report.trim().length < 40) return null;

    return {
      report: payload.report.slice(0, 120000),
      runId: typeof payload.runId === "string" ? payload.runId : undefined,
      liveSearch: payload.liveSearch === true,
      source: typeof payload.source === "string" ? payload.source : "abacus-market-gap",
      warning: typeof payload.warning === "string" ? payload.warning : undefined,
    };
  } catch (error) {
    console.error("[abacus-market-gap] worker unavailable", error);
    return null;
  }
}
