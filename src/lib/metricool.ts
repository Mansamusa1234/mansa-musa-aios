// Metricool scheduler client (REST API v2). The token stays server-side.
// Docs: https://help.metricool.com/wli-scheduling-endpoints-example-on-a-custom-backend-proxy-frko7
const METRICOOL_API = "https://app.metricool.com/api/v2/scheduler/posts";

export const SOCIAL_NETWORKS = ["facebook", "instagram", "tiktok", "youtube"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export function isMetricoolConfigured(): boolean {
  return Boolean(process.env.METRICOOL_USER_TOKEN && process.env.METRICOOL_USER_ID && process.env.METRICOOL_BLOG_ID);
}

/** Drafts stay inside Metricool for a final human check. Opt out explicitly to auto-publish at the scheduled time. */
export function metricoolDraftMode(): boolean {
  return process.env.METRICOOL_AUTO_PUBLISH !== "true";
}

export function utmLink(network: SocialNetwork, campaign: string): string {
  const url = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com");
  url.searchParams.set("utm_source", network);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export type ScheduleResult = { network: SocialNetwork; ok: boolean; postId?: string; error?: string };

export async function schedulePost(input: {
  network: SocialNetwork;
  text: string;
  mediaUrl?: string | null;
  dateTime: string; // local ISO without offset, e.g. 2026-10-15T18:00:00
  timezone: string;
}): Promise<ScheduleResult> {
  const query = new URLSearchParams({ blogId: process.env.METRICOOL_BLOG_ID!, userId: process.env.METRICOOL_USER_ID! });
  const draft = metricoolDraftMode();
  try {
    const res = await fetch(`${METRICOOL_API}?${query}`, {
      method: "POST",
      headers: { "X-Mc-Auth": process.env.METRICOOL_USER_TOKEN!, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        publicationDate: { dateTime: input.dateTime, timezone: input.timezone },
        text: input.text,
        providers: [{ network: input.network }],
        media: input.mediaUrl ? [input.mediaUrl] : [],
        saveExternalMediaFiles: Boolean(input.mediaUrl),
        autoPublish: !draft,
        draft,
        shortener: false,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { network: input.network, ok: false, error: `Metricool ${res.status}: ${JSON.stringify(body).slice(0, 300)}` };
    const postId = body?.data?.id ?? body?.id;
    return { network: input.network, ok: true, postId: postId != null ? String(postId) : undefined };
  } catch (err) {
    return { network: input.network, ok: false, error: err instanceof Error ? err.message : "Metricool request failed" };
  }
}
