/**
 * Social Media Automation
 * Auto-generates scripts, creates HeyGen videos, posts to all platforms
 */

export interface VideoScript {
  title: string;
  script: string;
  caption: string;
  hashtags: string[];
  platform: "instagram" | "linkedin" | "tiktok" | "youtube";
}

const SCRIPTS: VideoScript[] = [
  {
    title: "Stop Missing Calls — Your AI Receptionist is Ready",
    script: "Every missed call is a missed customer. MansaMusaAI answers every call, 24/7, books appointments, and captures leads — so you never lose business again.",
    caption: "Stop losing leads to voicemail. Your AI receptionist answers every call, even at 2am. 🤖📞",
    hashtags: ["#AIreceptionist", "#SmallBusiness", "#UKBusiness", "#MansaMusaAI", "#BusinessAutomation"],
    platform: "instagram",
  },
  {
    title: "How UK Businesses Are Cutting Costs with AI",
    script: "A full-time receptionist costs £22,000 a year. MansaMusaAI starts at £49 a month — and never takes a sick day. Book appointments, capture leads, and grow your business automatically.",
    caption: "Why pay £22k for a receptionist when AI does it for £49/month? 💡 #BusinessTips",
    hashtags: ["#CostSaving", "#AIBusiness", "#UKStartup", "#SmallBusinessUK", "#Automation"],
    platform: "linkedin",
  },
  {
    title: "3 Ways AI Is Transforming Small Business in the UK",
    script: "First: answering every call 24/7. Second: booking appointments automatically. Third: following up with leads via WhatsApp and email. This is MansaMusaAI.",
    caption: "3 ways AI is changing small business forever 🚀 #AIBusiness #UK",
    hashtags: ["#SmallBusiness", "#AI", "#UKBusiness", "#GrowthHacking", "#Entrepreneur"],
    platform: "tiktok",
  },
  {
    title: "Never Miss Another Lead With AI",
    script: "Your competitors are already using AI to capture every lead. MansaMusaAI gives you an AI receptionist, automatic appointment booking, and CRM — starting at just £49 a month.",
    caption: "Your competitors are already using AI. Are you? 🤖 #AI #UKBusiness #Leads",
    hashtags: ["#LeadGeneration", "#AIReceptionist", "#UK", "#BusinessGrowth", "#MansaMusaAI"],
    platform: "youtube",
  },
  {
    title: "The Future of Customer Service Is Here",
    script: "Imagine a receptionist that never sleeps, never gets frustrated, and captures every lead perfectly. That's MansaMusaAI. Set up in 2 minutes. Start free today.",
    caption: "A receptionist that works 24/7 and never calls in sick 🙌 #CustomerService #AI",
    hashtags: ["#CustomerService", "#FutureOfWork", "#AITools", "#UKBusiness", "#Productivity"],
    platform: "instagram",
  },
  {
    title: "From Missed Calls to More Revenue",
    script: "One missed call could be worth thousands. MansaMusaAI ensures every single call is answered, every lead is captured, and every appointment is booked — automatically.",
    caption: "Every missed call = lost revenue. Fix it with AI 💰 #Revenue #AI #Business",
    hashtags: ["#Revenue", "#BusinessTips", "#AIReceptionist", "#UKBusiness", "#Automation"],
    platform: "linkedin",
  },
  {
    title: "Set Up Your AI Receptionist in 2 Minutes",
    script: "No complicated setup. No tech skills needed. Just give your AI receptionist a name, a greeting, and you're live. MansaMusaAI — the simplest way to automate your business.",
    caption: "2 minutes to set up. Runs forever. 🤖 #SimpleAI #SmallBusiness #UK",
    hashtags: ["#EasySetup", "#SmallBusiness", "#AITools", "#UK", "#NoCode"],
    platform: "tiktok",
  },
];

export function getTodaysScript(): VideoScript {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return SCRIPTS[dayOfYear % SCRIPTS.length];
}

// ── HeyGen ──────────────────────────────────────────────────────────────────

export async function createHeyGenVideo(
  script: VideoScript,
  avatarId: string,
  voiceId: string
): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        video_inputs: [{
          character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
          voice: { type: "text", input_text: script.script, voice_id: voiceId },
          background: { type: "color", value: "#000000" },
        }],
        dimension: { width: 1080, height: 1920 },
        title: script.title,
      }),
    });
    const data = (await res.json()) as { data?: { video_id?: string } };
    return data?.data?.video_id ?? null;
  } catch {
    return null;
  }
}

export async function getHeyGenVideoUrl(videoId: string): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { "X-Api-Key": apiKey },
    });
    const data = (await res.json()) as { data?: { status?: string; video_url?: string } };
    if (data?.data?.status === "completed" && data.data.video_url) {
      return data.data.video_url;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Platform posting ─────────────────────────────────────────────────────────

const caption = (s: VideoScript) =>
  `${s.caption}\n\n${s.hashtags.join(" ")}`;

export async function postToLinkedIn(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;
  if (!token || !personId) return false;
  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: caption(script) },
            shareMediaCategory: "VIDEO",
            media: [{ status: "READY", originalUrl: videoUrl, title: { text: script.title } }],
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    return res.ok;
  } catch { return false; }
}

export async function postToLinkedInText(script: VideoScript): Promise<boolean> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;
  if (!token || !personId) return false;
  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author: `urn:li:person:${personId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: `${script.title}\n\n${script.script}\n\n${script.hashtags.join(" ")}` },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    return res.ok;
  } catch { return false; }
}

export async function postToInstagram(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!token || !accountId) return false;
  try {
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/media?video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption(script))}&media_type=REELS&access_token=${token}`,
      { method: "POST" }
    );
    const container = (await containerRes.json()) as { id?: string };
    if (!container.id) return false;

    await new Promise((r) => setTimeout(r, 30_000));

    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/media_publish?creation_id=${container.id}&access_token=${token}`,
      { method: "POST" }
    );
    return publishRes.ok;
  } catch { return false; }
}

export async function postToTikTok(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({
        post_info: { title: caption(script).slice(0, 2200), privacy_level: "PUBLIC_TO_EVERYONE", disable_comment: false },
        source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
      }),
    });
    return res.ok;
  } catch { return false; }
}

export async function postToYouTube(videoUrl: string, script: VideoScript): Promise<boolean> {
  // YouTube requires OAuth upload flow — skip if not configured
  const token = process.env.YOUTUBE_ACCESS_TOKEN;
  if (!token || !videoUrl) return false;
  // Simplified: log intent; full multipart upload is complex
  console.log(`[social] YouTube upload queued: ${script.title} -> ${videoUrl}`);
  return false;
}

export async function postToTwitter(videoUrl: string, script: VideoScript): Promise<boolean> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessSecret) return false;

  try {
    void bearerToken;
    // OAuth 1.0a signature
    const text = caption(script).slice(0, 280);
    const oauthHeader = buildOAuth1Header("POST", "https://api.twitter.com/2/tweets", {}, apiKey, apiSecret, accessToken, accessSecret);
    const body: Record<string, unknown> = { text };
    if (videoUrl) body.media = { media_ids: [] }; // video upload requires separate media endpoint
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { Authorization: oauthHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch { return false; }
}

export async function postToFacebook(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId || !videoUrl) return false;
  try {
    const res = await fetch(`https://graph-video.facebook.com/${pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_url: videoUrl, description: caption(script), access_token: token }),
    });
    return res.ok;
  } catch { return false; }
}

export async function postToFacebookText(script: VideoScript): Promise<boolean> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `${script.title}\n\n${script.script}\n\n${script.hashtags.join(" ")}`, access_token: token }),
    });
    return res.ok;
  } catch { return false; }
}

export async function postToThreads(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) return false;
  try {
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads?media_type=VIDEO&video_url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(caption(script))}&access_token=${token}`,
      { method: "POST" }
    );
    const container = (await containerRes.json()) as { id?: string };
    if (!container.id) return false;
    await new Promise((r) => setTimeout(r, 15_000));
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${container.id}&access_token=${token}`,
      { method: "POST" }
    );
    return publishRes.ok;
  } catch { return false; }
}

export async function postToThreadsText(script: VideoScript): Promise<boolean> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) return false;
  try {
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads?media_type=TEXT&text=${encodeURIComponent(caption(script))}&access_token=${token}`,
      { method: "POST" }
    );
    const container = (await containerRes.json()) as { id?: string };
    if (!container.id) return false;
    await new Promise((r) => setTimeout(r, 5_000));
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${container.id}&access_token=${token}`,
      { method: "POST" }
    );
    return publishRes.ok;
  } catch { return false; }
}

export async function postToPinterest(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (!token || !boardId || !videoUrl) return false;
  try {
    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        board_id: boardId,
        title: script.title,
        description: caption(script),
        media_source: { source_type: "video_url", url: videoUrl },
      }),
    });
    return res.ok;
  } catch { return false; }
}

// ── OAuth 1.0a helper (Twitter) ──────────────────────────────────────────────

import { createHmac } from "crypto";

function buildOAuth1Header(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string
): string {
  const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: token,
    oauth_version: "1.0",
    ...params,
  };
  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join("&");
  const sigBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join("&");
  const sigKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = createHmac("sha1", sigKey).update(sigBase).digest("base64");
  oauthParams.oauth_signature = signature;
  const headerParts = Object.keys(oauthParams)
    .filter((k) => k.startsWith("oauth_"))
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`);
  return `OAuth ${headerParts.join(", ")}`;
}
