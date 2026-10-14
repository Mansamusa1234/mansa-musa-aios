// Publishes an approved daily draft through the platforms' own APIs (no Metricool API needed).
// Only called from the admin approval route, never from a cron.
import { postToFacebook, postToFacebookText, postToInstagram, postToTikTok, postToYouTube, type VideoScript } from "@/lib/social-automation";
import { utmLink, type SocialNetwork } from "@/lib/metricool";

export function directPublishEnabled(): boolean {
  return process.env.SOCIAL_DIRECT_PUBLISH === "true";
}

/**
 * Networks the owner has explicitly cleared for live posting (SOCIAL_PUBLISH_NETWORKS, comma-separated).
 * Empty by default, so a newly connected platform never receives a post until the owner adds it
 * after approving its first post.
 */
export function networkEnabled(network: SocialNetwork): boolean {
  return (process.env.SOCIAL_PUBLISH_NETWORKS ?? "").split(",").map((n) => n.trim().toLowerCase()).includes(network);
}

/** Whether the app holds its own credentials for a network (Metricool's connections are separate). */
export function networkConfigured(network: SocialNetwork): boolean {
  const env = process.env;
  switch (network) {
    case "facebook": return Boolean(env.FACEBOOK_PAGE_ACCESS_TOKEN && env.FACEBOOK_PAGE_ID);
    case "instagram": return Boolean(env.INSTAGRAM_USER_ID);
    case "tiktok": return Boolean(env.TIKTOK_ACCESS_TOKEN);
    case "youtube": return Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN);
  }
}

export type PublishResult = { network: SocialNetwork; ok: boolean; skipped?: "not_enabled" | "not_connected" | "needs_video"; postId?: string; url?: string | null; error?: string };

export async function publishDraft(input: {
  draftId: string;
  title: string;
  script: string;
  caption: string;
  videoUrl?: string | null;
  networks: SocialNetwork[];
}): Promise<PublishResult[]> {
  return Promise.all(input.networks.map(async (network): Promise<PublishResult> => {
    if (!networkEnabled(network)) return { network, ok: false, skipped: "not_enabled" };
    if (!networkConfigured(network)) return { network, ok: false, skipped: "not_connected" };
    if (!input.videoUrl && network !== "facebook") return { network, ok: false, skipped: "needs_video" };
    // Hashtags are already part of the approved caption; the UTM link attributes leads and revenue.
    const script: VideoScript = {
      title: input.title,
      script: input.script,
      caption: `${input.caption}\n\n${utmLink(network, input.draftId)}`,
      hashtags: [],
      platform: network === "facebook" ? "instagram" : network,
    };
    try {
      const receipt = input.videoUrl
        ? await ({ facebook: postToFacebook, instagram: postToInstagram, tiktok: postToTikTok, youtube: postToYouTube }[network])(input.videoUrl, script)
        : await postToFacebookText({ ...script, script: script.caption });
      return receipt
        ? { network, ok: true, postId: receipt.id, url: receipt.url }
        : { network, ok: false, error: "Platform rejected the post (see server logs)" };
    } catch (err) {
      return { network, ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }));
}
