export type AbacusMarketingDraft = {
  platform: string;
  title: string;
  content: string;
  requiresVideo?: boolean;
  metadata?: Record<string, unknown>;
};

export type AbacusMarketingResult = {
  drafts: AbacusMarketingDraft[];
  runId?: string;
};

export function isAbacusWorkerConfigured(): boolean {
  return Boolean(process.env.ABACUS_WORKER_URL);
}

export async function runAbacusMarketingWorker(input: {
  campaign: string;
  brief?: string;
  fallbackTitle: string;
  fallbackScript: string;
  fallbackCaption: string;
  fallbackHashtags: string[];
}): Promise<AbacusMarketingResult | null> {
  const url = process.env.ABACUS_WORKER_URL;
  if (!url) return null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ABACUS_WORKER_TOKEN
          ? { Authorization: `Bearer ${process.env.ABACUS_WORKER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        job: "mansa-marketing-team",
        version: 1,
        ...input,
      }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[abacus-worker] HTTP", response.status, await response.text().catch(() => ""));
      return null;
    }

    const data = await response.json() as Partial<AbacusMarketingResult>;
    if (!Array.isArray(data.drafts) || data.drafts.length === 0) return null;

    return {
      runId: typeof data.runId === "string" ? data.runId : undefined,
      drafts: data.drafts
        .filter((draft): draft is AbacusMarketingDraft =>
          Boolean(draft && typeof draft.platform === "string" && typeof draft.title === "string" && typeof draft.content === "string")
        )
        .slice(0, 24),
    };
  } catch (error) {
    console.error("[abacus-worker] unavailable, falling back to native generation", error);
    return null;
  }
}
