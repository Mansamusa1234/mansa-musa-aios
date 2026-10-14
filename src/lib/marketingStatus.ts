// Admin view of marketing channels: which ones work, which need reconnecting, which need setting up,
// and which are not offered yet. Provider checks are read-only (identity / token refresh only), run
// server-side, and return plain-language messages — never tokens or raw provider responses.
import { db } from "@/lib/db";
import { isMetricoolConfigured } from "@/lib/metricool";
import { directPublishEnabled, networkEnabled } from "@/lib/socialPublisher";
import { youtubeRefreshToken } from "@/lib/social-automation";

export type ChannelState = "connected" | "ready" | "reconnect" | "setup" | "coming_soon";

export interface ChannelStatus {
  key: string;
  name: string;
  group: "Social publishing" | "Content" | "Email" | "Tracking" | "Advertising";
  state: ChannelState;
  detail: string;
  action?: string;
}

const TIMEOUT = 8000;
type Probe = { ok: true } | { ok: false; reason: string };

async function getJson(url: string, init?: RequestInit): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT), cache: "no-store" });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

function metaReason(body: Record<string, unknown>): string {
  const err = (body.error ?? {}) as { code?: number; error_subcode?: number };
  if (err.code === 190) return "Access token expired or revoked";
  if (err.code === 10 || err.code === 200) return "Missing permission";
  return "Rejected by Meta";
}

export async function probeInstagram(env = process.env): Promise<Probe> {
  const igUserId = env.INSTAGRAM_USER_ID;
  const stored = igUserId
    ? await db.account.findUnique({ where: { provider_providerAccountId: { provider: "instagram-social", providerAccountId: igUserId } }, select: { access_token: true } }).catch(() => null)
    : null;
  const token = stored?.access_token ?? env.INSTAGRAM_ACCESS_TOKEN;
  if (!token || !igUserId) return { ok: false, reason: "missing" };
  const { status, body } = await getJson(`https://graph.instagram.com/v25.0/me?fields=id,user_id&access_token=${encodeURIComponent(token)}`);
  if (status !== 200) return { ok: false, reason: metaReason(body) };
  return String(body.user_id ?? "") === igUserId || String(body.id ?? "") === igUserId ? { ok: true } : { ok: false, reason: "Token belongs to a different account" };
}

export async function probeFacebook(env = process.env): Promise<Probe> {
  if (!env.FACEBOOK_PAGE_ACCESS_TOKEN || !env.FACEBOOK_PAGE_ID) return { ok: false, reason: "missing" };
  const { status, body } = await getJson(`https://graph.facebook.com/v19.0/${encodeURIComponent(env.FACEBOOK_PAGE_ID)}?fields=id&access_token=${encodeURIComponent(env.FACEBOOK_PAGE_ACCESS_TOKEN)}`);
  return status === 200 ? { ok: true } : { ok: false, reason: metaReason(body) };
}

export async function probeYouTube(env = process.env): Promise<Probe> {
  const refresh = await youtubeRefreshToken().catch(() => null);
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !refresh) return { ok: false, reason: "missing" };
  const { status, body } = await getJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.YOUTUBE_CLIENT_ID, client_secret: env.YOUTUBE_CLIENT_SECRET, refresh_token: refresh, grant_type: "refresh_token" }),
  });
  if (status === 200) return { ok: true };
  if (body.error === "invalid_client") return { ok: false, reason: "OAuth client secret rejected" };
  if (body.error === "invalid_grant") return { ok: false, reason: "Authorisation revoked or expired" };
  return { ok: false, reason: "Rejected by Google" };
}

async function safely(probe: () => Promise<Probe>): Promise<Probe> {
  try { return await probe(); } catch { return { ok: false, reason: "Could not reach the provider" }; }
}

function social(key: "instagram" | "facebook" | "youtube" | "tiktok", name: string, probe: Probe, reconnect: string, setup: string): ChannelStatus {
  if (!probe.ok && probe.reason === "missing") return { key, name, group: "Social publishing", state: "setup", detail: "Not connected.", action: setup };
  if (!probe.ok) return { key, name, group: "Social publishing", state: "reconnect", detail: `${probe.reason}.`, action: reconnect };
  const live = directPublishEnabled() && networkEnabled(key);
  return live
    ? { key, name, group: "Social publishing", state: "connected", detail: "Connected. Approved drafts are published here." }
    : { key, name, group: "Social publishing", state: "ready", detail: "Connected, not enabled for publishing.", action: `Approve its first post, then add "${key}" to SOCIAL_PUBLISH_NETWORKS and set SOCIAL_DIRECT_PUBLISH=true.` };
}

export async function getMarketingChannels(env = process.env): Promise<ChannelStatus[]> {
  const [instagram, facebook, youtube] = await Promise.all([safely(() => probeInstagram(env)), safely(() => probeFacebook(env)), safely(() => probeYouTube(env))]);
  const configured = (name: string) => Boolean(env[name]?.trim());
  const simple = (key: string, name: string, group: ChannelStatus["group"], ok: boolean, okDetail: string, setup: string): ChannelStatus =>
    ok ? { key, name, group, state: "ready", detail: okDetail } : { key, name, group, state: "setup", detail: "Not configured.", action: setup };

  return [
    social("instagram", "Instagram", instagram, "Reconnect the Instagram professional account and update INSTAGRAM_ACCESS_TOKEN.", "Set INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN."),
    social("facebook", "Facebook Page", facebook, "Generate a new long-lived Page access token and update FACEBOOK_PAGE_ACCESS_TOKEN.", "Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN."),
    social("youtube", "YouTube", youtube, "Update YOUTUBE_CLIENT_SECRET if needed, then reconnect at /api/auth while signed in as admin.", "Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET, then connect at /api/auth while signed in as admin."),
    configured("TIKTOK_ACCESS_TOKEN")
      ? { key: "tiktok", name: "TikTok", group: "Social publishing", state: "ready", detail: "Token configured; not checked automatically." }
      : { key: "tiktok", name: "TikTok", group: "Social publishing", state: "setup", detail: "Not connected.", action: "Requires TikTok Content Posting API approval, then set TIKTOK_ACCESS_TOKEN." },
    simple("video-hosting", "Daily video hosting", "Content", configured("SOCIAL_VIDEO_BASE_URL"), "Daily videos are attached to drafts from the Blob store.", "Set SOCIAL_VIDEO_BASE_URL and add the BLOB_READ_WRITE_TOKEN GitHub Actions secret."),
    configured("HEYGEN_API_KEY") && env.SOCIAL_HEYGEN_ENABLED === "true"
      ? { key: "heygen", name: "HeyGen avatar video", group: "Content", state: "ready", detail: "Enabled; uses HeyGen credits." }
      : { key: "heygen", name: "HeyGen avatar video", group: "Content", state: "setup", detail: "Off. The free captioned video renderer is used instead.", action: "Optional: add HeyGen credits and set SOCIAL_HEYGEN_ENABLED=true." },
    isMetricoolConfigured()
      ? { key: "metricool", name: "Metricool", group: "Content", state: "ready", detail: "Approved posts are saved as Metricool drafts." }
      : { key: "metricool", name: "Metricool", group: "Content", state: "setup", detail: "No API access (the Free plan has none). Schedule manually in Metricool.", action: "Optional: a Metricool plan with API access, then METRICOOL_USER_TOKEN, METRICOOL_USER_ID and METRICOOL_BLOG_ID." },
    simple("medium", "Medium", "Content", configured("MEDIUM_INTEGRATION_TOKEN"), "Creates drafts for you to publish.", "Optional: set MEDIUM_INTEGRATION_TOKEN."),
    simple("substack", "Substack", "Content", configured("SUBSTACK_SESSION_COOKIE") && configured("SUBSTACK_PUBLICATION"), "Creates drafts for you to send.", "Optional: set SUBSTACK_PUBLICATION and SUBSTACK_SESSION_COOKIE."),
    configured("RESEND_API_KEY")
      ? { key: "email", name: "Newsletter & transactional email", group: "Email", state: "connected", detail: "Sending through Resend." }
      : { key: "email", name: "Newsletter & transactional email", group: "Email", state: "setup", detail: "Not configured.", action: "Set RESEND_API_KEY." },
    simple("ga", "Google Analytics", "Tracking", configured("NEXT_PUBLIC_GA_ID"), "Loads after visitor consent.", "Optional: set NEXT_PUBLIC_GA_ID."),
    simple("meta-pixel", "Meta Pixel", "Tracking", configured("NEXT_PUBLIC_META_PIXEL_ID"), "Loads after visitor consent.", "Optional: set NEXT_PUBLIC_META_PIXEL_ID."),
    simple("tiktok-pixel", "TikTok Pixel", "Tracking", configured("NEXT_PUBLIC_TIKTOK_PIXEL_ID"), "Loads after visitor consent.", "Optional: set NEXT_PUBLIC_TIKTOK_PIXEL_ID."),
    { key: "meta-ads", name: "Meta Ads", group: "Advertising", state: "coming_soon", detail: "Not available in the app yet. Run campaigns in Meta Ads Manager." },
    { key: "google-ads", name: "Google Ads", group: "Advertising", state: "coming_soon", detail: "Not available in the app yet. Run campaigns in Google Ads." },
    { key: "tiktok-ads", name: "TikTok Ads", group: "Advertising", state: "coming_soon", detail: "Not available in the app yet. Run campaigns in TikTok Ads Manager." },
  ];
}
