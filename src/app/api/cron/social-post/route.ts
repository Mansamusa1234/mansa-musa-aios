import { NextResponse } from "next/server";
import {
  getTodaysScript,
  createHeyGenVideo,
  getHeyGenVideoUrl,
  postToLinkedIn,
  postToInstagram,
  postToTikTok,
} from "@/lib/social-automation";

// Runs daily via Vercel Cron - posts a new Mansa video to all platforms
export async function GET(req: Request) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avatarId = process.env.HEYGEN_AVATAR_ID ?? "";
  const voiceId = process.env.HEYGEN_VOICE_ID ?? "";

  // 1. Pick today's script
  const script = getTodaysScript();

  // 2. Create HeyGen video
  const videoId = await createHeyGenVideo(script, avatarId, voiceId);
  if (!videoId) {
    return NextResponse.json({ error: "Failed to create HeyGen video" }, { status: 500 });
  }

  // 3. Wait for video to render (poll every 30s, max 10 minutes)
  let videoUrl: string | null = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 30000));
    videoUrl = await getHeyGenVideoUrl(videoId);
    if (videoUrl) break;
  }

  if (!videoUrl) {
    return NextResponse.json({ error: "Video rendering timed out" }, { status: 500 });
  }

  // 4. Post to all platforms simultaneously
  const [linkedin, instagram, tiktok] = await Promise.all([
    postToLinkedIn(videoUrl, script),
    postToInstagram(videoUrl, script),
    postToTikTok(videoUrl, script),
  ]);

  return NextResponse.json({
    ok: true,
    script: script.title,
    videoId,
    videoUrl,
    posted: { linkedin, instagram, tiktok },
    timestamp: new Date().toISOString(),
  });
}
