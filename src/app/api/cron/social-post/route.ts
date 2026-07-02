import { NextResponse } from "next/server";
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

// Runs daily via Vercel Cron at 9am.
// Mode A (video): HeyGen creates a video → posted to all 8 platforms as video + caption.
// Mode B (text): No HeyGen — posts professional text to Twitter, LinkedIn, Facebook, Threads.
// Either way something posts every single day.
export async function GET(req: Request) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avatarId = process.env.HEYGEN_AVATAR_ID ?? "";
  const voiceId = process.env.HEYGEN_VOICE_ID ?? "";
  const script = getTodaysScript();

  let videoUrl: string | null = null;

  // Attempt HeyGen video creation
  if (process.env.HEYGEN_API_KEY && avatarId && voiceId) {
    const videoId = await createHeyGenVideo(script, avatarId, voiceId);
    if (videoId) {
      // Poll up to 10 minutes for render to complete
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 30000));
        videoUrl = await getHeyGenVideoUrl(videoId);
        if (videoUrl) break;
      }
    }
  }

  let posted: Record<string, boolean>;

  if (videoUrl) {
    // Mode A: Full video posts to all platforms
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
    // Mode B: Text posts to all text-capable platforms (no video required)
    const [twitter, linkedin, facebook, threads] = await Promise.all([
      postToTwitter("", script),
      postToLinkedInText(script),
      postToFacebookText(script),
      postToThreadsText(script),
    ]);
    posted = { twitter, linkedin, facebook, threads, instagram: false, tiktok: false, youtube: false, pinterest: false };
  }

  const successCount = Object.values(posted).filter(Boolean).length;

  return NextResponse.json({
    ok: true,
    script: script.title,
    mode: videoUrl ? "video" : "text",
    videoUrl,
    posted,
    successCount,
    timestamp: new Date().toISOString(),
  });
}
