import { getTodaysScript, MANSA_INTRO_SCRIPT, createHeyGenVideo, getHeyGenVideoUrl } from "@/lib/social-automation";
import { withCron } from "@/lib/cronUtils";
import { db } from "@/lib/db";
import { SOCIAL_NETWORKS } from "@/lib/metricool";

export const maxDuration = 300;

export type SocialDraftMetadata = {
  kind: "daily_video";
  day: string; // YYYY-MM-DD (Europe/London)
  scriptTitle: string;
  script: string;
  hashtags: string[];
  networks: string[];
  videoId?: string | null;
  videoUrl?: string | null;
  videoError?: string;
  metricool?: unknown;
};

/** Daily video rendered by the GitHub Actions workflow and stored at <base>/social/<day>.mp4. */
async function renderedVideoUrl(day: string): Promise<string | null> {
  const base = process.env.SOCIAL_VIDEO_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const url = `${base}/social/${day}.mp4`;
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

function londonDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

// Daily content pipeline step 1: campaign idea → script → (video) → captions → approval queue.
// Nothing is published here. Publication happens only after an admin approves the draft.
export const GET = withCron(async (request) => {
  const campaign = new URL(request.url).searchParams.get("campaign");
  const script = campaign === "intro" ? MANSA_INTRO_SCRIPT : getTodaysScript();
  const day = londonDay();

  // Attach finished videos to earlier drafts still waiting on HeyGen.
  const rendering = await db.contentQueue.findMany({ where: { type: "social_post", status: "PENDING", platform: "multi" }, take: 20 });
  let videosAttached = 0;
  for (const item of rendering) {
    let meta: SocialDraftMetadata;
    try { meta = JSON.parse(item.metadata ?? "{}"); } catch { continue; }
    if (meta.kind !== "daily_video" || meta.videoUrl) continue;
    try {
      const url = meta.videoId ? await getHeyGenVideoUrl(meta.videoId) : await renderedVideoUrl(meta.day);
      if (!url) continue;
      meta.videoUrl = url; videosAttached++;
    } catch (err) {
      meta.videoError = err instanceof Error ? err.message : String(err);
    }
    await db.contentQueue.update({ where: { id: item.id }, data: { metadata: JSON.stringify(meta) } });
  }

  const existing = await db.contentQueue.findFirst({
    where: { type: "social_post", platform: "multi", metadata: { contains: `"day":"${day}"` } },
    select: { id: true },
  });
  if (existing) return { queued: false, reason: "Today's draft already exists", draftId: existing.id, videosAttached };

  const avatarId = process.env.HEYGEN_AVATAR_ID ?? "";
  const voiceId = process.env.HEYGEN_VOICE_ID ?? "";
  let videoId: string | null = null;
  let videoError: string | undefined;
  // HeyGen spends credits: opt in explicitly.
  if (process.env.SOCIAL_HEYGEN_ENABLED === "true" && process.env.HEYGEN_API_KEY && avatarId && voiceId) {
    try { videoId = await createHeyGenVideo(script, avatarId, voiceId); }
    catch (err) { videoError = err instanceof Error ? err.message : String(err); }
  }
  const initialVideoUrl = campaign === "intro"
    ? `${(process.env.NEXT_PUBLIC_APP_URL || "https://www.mansamusainitiative.com").replace(/\/$/, "")}/media/mansamusa-intro.mp4`
    : videoId ? null : await renderedVideoUrl(day);

  const metadata: SocialDraftMetadata = {
    kind: "daily_video", day, scriptTitle: script.title, script: script.script, hashtags: script.hashtags,
    networks: [...SOCIAL_NETWORKS], videoId, videoUrl: initialVideoUrl, ...(videoError ? { videoError } : {}),
  };
  const draft = await db.contentQueue.create({
    data: {
      type: "social_post",
      platform: "multi",
      title: `${day} · ${script.title}`,
      content: `${script.caption}\n\n${script.hashtags.join(" ")}`,
      metadata: JSON.stringify(metadata),
      status: "PENDING",
    },
  });

  return { queued: true, draftId: draft.id, video: videoId ? "rendering" : initialVideoUrl ? "attached" : "none", videosAttached };
});
