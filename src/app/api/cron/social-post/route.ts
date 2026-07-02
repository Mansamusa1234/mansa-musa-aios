import {
  getTodaysScript,
  createHeyGenVideo,
  getHeyGenVideoUrl,
  postToLinkedIn,
  postToInstagram,
  postToTikTok,
  postToYouTube,
  postToTwitter,
  postToFacebook,
  postToThreads,
  postToPinterest,
  postToLinkedInText,
  postToFacebookText,
  postToThreadsText,
} from "@/lib/social-automation";
import { withCron } from "@/lib/cronUtils";

export const GET = withCron(async () => {
  const avatarId = process.env.HEYGEN_AVATAR_ID ?? "";
  const voiceId = process.env.HEYGEN_VOICE_ID ?? "";
  const script = getTodaysScript();

  let videoUrl: string | null = null;

  if (process.env.HEYGEN_API_KEY && avatarId && voiceId) {
    const videoId = await createHeyGenVideo(script, avatarId, voiceId);
    if (videoId) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 30000));
        videoUrl = await getHeyGenVideoUrl(videoId);
        if (videoUrl) break;
      }
    }
  }

  let posted: Record<string, boolean>;

  if (videoUrl) {
    const [linkedin, instagram, tiktok, youtube, twitter, facebook, threads, pinterest] = await Promise.all([
      postToLinkedIn(videoUrl, script),
      postToInstagram(videoUrl, script),
      postToTikTok(videoUrl, script),
      postToYouTube(videoUrl, script),
      postToTwitter(videoUrl, script),
      postToFacebook(videoUrl, script),
      postToThreads(videoUrl, script),
      postToPinterest(videoUrl, script),
    ]);
    posted = { linkedin, instagram, tiktok, youtube, twitter, facebook, threads, pinterest };
  } else {
    const [twitter, linkedin, facebook, threads] = await Promise.all([
      postToTwitter("", script),
      postToLinkedInText(script),
      postToFacebookText(script),
      postToThreadsText(script),
    ]);
    posted = { twitter, linkedin, facebook, threads, instagram: false, tiktok: false, youtube: false, pinterest: false };
  }

  const successCount = Object.values(posted).filter(Boolean).length;

  return {
    script: script.title,
    mode: videoUrl ? "video" : "text",
    videoUrl,
    posted,
    successCount,
  };
});
