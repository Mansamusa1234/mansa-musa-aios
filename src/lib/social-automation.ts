/**
 * Social Media Automation
 * Auto-generates scripts, creates HeyGen videos, posts to Instagram/LinkedIn/TikTok/Twitter/Facebook/Threads/Pinterest
 */

import { createHmac } from "crypto";

export interface VideoScript {
  title: string;
  script: string;
  caption: string;
  hashtags: string[];
  platform: "instagram" | "linkedin" | "tiktok" | "youtube";
}

export const MANSA_SCRIPTS: VideoScript[] = [
  {
    title: "Missed Calls Cost You Money",
    script: `Your receptionist just cost you a customer.
They missed the call. Again.
While your competitor answered instantly — with an AI receptionist that never sleeps, never calls in sick, and never misses a lead.
At Mansa Musa AI, we give UK businesses an AI receptionist that books appointments, captures leads, and follows up automatically.
24 hours a day. 7 days a week.
Your competitors are already using this. Are you?
Visit mansamusainitiative.com and start free today.`,
    caption: "Your receptionist just cost you a customer. We fixed that. AI receptionists for UK businesses — 24/7, never misses a call. Start free 👇 mansamusainitiative.com",
    hashtags: ["#AIReceptionist", "#UKBusiness", "#SmallBusiness", "#BusinessAutomation", "#MansaMusaAI"],
    platform: "instagram",
  },
  {
    title: "While You Sleep",
    script: `While you sleep, your competitor is taking your customers.
Every missed call is a lost sale.
Every unanswered message is money walking out the door.
Mansa Musa AI gives your business an AI receptionist that works 24 hours a day, 7 days a week.
It books appointments. Captures leads. Follows up automatically.
You wake up to new customers — not missed opportunities.
Start free at mansamusainitiative.com`,
    caption: "While you sleep your competitor is taking your customers. Get an AI receptionist that works 24/7. Start free 👇 mansamusainitiative.com",
    hashtags: ["#UKBusiness", "#AITools", "#BusinessGrowth", "#Automation", "#MansaMusaAI"],
    platform: "instagram",
  },
  {
    title: "The £49 Employee",
    script: `What if you could hire an employee who never takes a day off, never calls in sick, never misses a call, and costs less than £2 a day?
That's Mansa Musa AI.
An AI receptionist that answers every call, books every appointment, and captures every lead — automatically.
UK businesses are replacing expensive front desks with smart AI that works harder and costs less.
£49 a month. No contracts. Start free today at mansamusainitiative.com`,
    caption: "An employee who never calls in sick, never misses a call, costs £49/month. That's our AI receptionist. Start free 👇 mansamusainitiative.com",
    hashtags: ["#UKSmallBusiness", "#AIReceptionist", "#BusinessAutomation", "#Productivity", "#MansaMusaAI"],
    platform: "linkedin",
  },
  {
    title: "Stop Losing Leads",
    script: `Every time your phone rings and nobody answers — that's a lead gone forever.
They don't leave voicemails. They call your competitor.
Mansa Musa AI catches every call, every time.
Our AI receptionist answers instantly, books appointments directly into your calendar, and follows up with every lead automatically.
No missed calls. No lost customers. No stress.
UK businesses are signing up free at mansamusainitiative.com — are you next?`,
    caption: "Every missed call is a customer going to your competitor. Stop losing leads. Get your AI receptionist free 👇 mansamusainitiative.com",
    hashtags: ["#LeadGeneration", "#UKBusiness", "#AI", "#SalesAutomation", "#MansaMusaAI"],
    platform: "tiktok",
  },
  {
    title: "The Truth About Small Business",
    script: `Here's the truth nobody tells small business owners.
You're not losing customers because of your product.
You're losing them because nobody answered the phone.
80% of callers who reach voicemail never call back.
They go to your competitor who picked up.
Mansa Musa AI fixes this with an AI receptionist that answers every call, 24 hours a day.
It books appointments. Captures leads. Sends follow-ups.
All automatically. Starting at £49 a month.
Visit mansamusainitiative.com and never miss another customer.`,
    caption: "80% of callers who reach voicemail never call back. They call your competitor. Fix it with AI 👇 mansamusainitiative.com",
    hashtags: ["#SmallBusinessTips", "#UKEntrepreneur", "#AIBusiness", "#CustomerService", "#MansaMusaAI"],
    platform: "linkedin",
  },
  {
    title: "WhatsApp + AI",
    script: `Your customers aren't just calling — they're messaging on WhatsApp too.
And if nobody replies within 5 minutes, they've moved on.
Mansa Musa AI handles both.
Phone calls answered instantly. WhatsApp messages replied to automatically.
Appointments booked. Leads captured. Follow-ups sent.
All without you lifting a finger.
This is the future of UK business — and it starts at £49 a month.
Get started free at mansamusainitiative.com`,
    caption: "Calls AND WhatsApp — both handled automatically by your AI receptionist. Start free 👇 mansamusainitiative.com",
    hashtags: ["#WhatsAppBusiness", "#AIReceptionist", "#UKBusiness", "#Automation", "#MansaMusaAI"],
    platform: "instagram",
  },
  {
    title: "For Barbers and Salons",
    script: `Barbers. Hair salons. Nail technicians.
You can't answer the phone when your hands are full.
But every missed call is a missed booking.
Mansa Musa AI gives you an AI receptionist that answers calls, books appointments into your calendar, and sends reminders automatically.
No more no-shows. No more missed bookings. No more lost money.
UK salons are switching to AI and saving thousands a year.
Start free at mansamusainitiative.com`,
    caption: "Barbers & salons — stop missing bookings when your hands are full. AI receptionist answers every call 👇 mansamusainitiative.com",
    hashtags: ["#BarberShop", "#HairSalon", "#UKSalon", "#BookingAutomation", "#MansaMusaAI"],
    platform: "tiktok",
  },
  {
    title: "For Plumbers and Trades",
    script: `Plumbers. Electricians. Builders.
You're on the job. You can't answer your phone.
But that call you missed? That was a £500 job going to someone else.
Mansa Musa AI answers every call for you.
It takes the job details, books them in, and sends you a summary.
You finish your current job. Your next job is already booked.
UK tradespeople are earning more by missing fewer calls.
Start free at mansamusainitiative.com`,
    caption: "Plumbers & trades — every missed call is a £500 job lost. AI receptionist handles it while you work 👇 mansamusainitiative.com",
    hashtags: ["#Plumber", "#UKTrades", "#Electrician", "#TradesmenUK", "#MansaMusaAI"],
    platform: "tiktok",
  },
  {
    title: "Affiliate Opportunity",
    script: `What if you could earn recurring commissions just by referring businesses to a service they already need?
Mansa Musa AI has an affiliate programme that pays you every single month — for every business you refer.
Refer a plumber. They pay £49 a month. You earn commission every month they stay.
Refer 10 businesses. Earn passive income every month.
No selling. No convincing. Just sharing something that genuinely helps UK businesses.
Join the affiliate programme at mansamusainitiative.com`,
    caption: "Earn recurring monthly commissions referring UK businesses to AI. Join our affiliate programme 👇 mansamusainitiative.com",
    hashtags: ["#AffiliateMarketing", "#PassiveIncome", "#UKAffiliate", "#SideHustle", "#MansaMusaAI"],
    platform: "linkedin",
  },
  {
    title: "Restaurants",
    script: `Restaurant owners — your phone rings during the dinner rush.
Nobody picks up.
That was a table for 8 gone forever.
Mansa Musa AI gives your restaurant an AI receptionist that takes reservations, answers questions about your menu, and handles calls 24 hours a day.
Your staff focus on the customers in front of them.
Your AI handles everyone else.
Start free at mansamusainitiative.com`,
    caption: "Restaurants — stop losing reservations during the rush. AI answers every call 👇 mansamusainitiative.com",
    hashtags: ["#RestaurantBusiness", "#UKRestaurant", "#HospitalityUK", "#FoodBusiness", "#MansaMusaAI"],
    platform: "instagram",
  },
];

export const MANSA_INTRO_SCRIPT: VideoScript = {
  title: "Meet MansaMusaAI — Your AI Workforce",
  script: `Meet MansaMusaAI — the AI workforce built to help your business grow.
One platform gives you specialist AI agents for sales, customer service, marketing, finance, operations and more.
Your AI receptionist answers calls around the clock, captures leads, books appointments and follows up automatically.
Whether you run a restaurant, salon, trade business, clinic, property company or online brand, MansaMusaAI helps you do more without hiring a full department.
Start free today at mansamusainitiative.com.`,
  caption: "Meet MansaMusaAI — your complete AI workforce. Answer calls, capture leads, book appointments and run your business 24/7. Start free at mansamusainitiative.com",
  hashtags: ["#MansaMusaAI", "#AIWorkforce", "#AIReceptionist", "#BusinessAutomation", "#UKBusiness"],
  platform: "youtube",
};

async function reportProviderFailure(provider: string, response: Response): Promise<void> {
  if (response.ok) return;
  const detail = await response.text().catch(() => "");
  console.error(`[social:${provider}] HTTP ${response.status}`, detail.slice(0, 1200));
}

export function getTodaysScript(platform?: VideoScript["platform"]): VideoScript {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const filtered = platform ? MANSA_SCRIPTS.filter(s => s.platform === platform) : MANSA_SCRIPTS;
  return filtered[dayOfYear % filtered.length];
}

export async function createHeyGenVideo(script: VideoScript, avatarId: string, voiceId: string): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
        voice: { type: "text", input_text: script.script, voice_id: voiceId },
      }],
      dimension: { width: 1080, height: 1920 },
      title: script.title,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.data?.video_id) {
    console.error("[social:heygen] video generation failed", res.status, JSON.stringify(data).slice(0, 1200));
  }
  return data?.data?.video_id ?? null;
}

export async function getHeyGenVideoUrl(videoId: string): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": apiKey },
  });

  const data = await res.json();
  if (!res.ok || data?.data?.status === "failed") {
    console.error("[social:heygen] video status failed", res.status, JSON.stringify(data).slice(0, 1200));
  }
  return data?.data?.status === "completed" ? data.data.video_url : null;
}

export async function postToTikTok(videoUrl: string, script: VideoScript): Promise<boolean> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) return false;

  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}`;

  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: caption.slice(0, 2200),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const initData = await initRes.json();
  if (!initRes.ok || !initData?.data?.publish_id) {
    console.error("[social:tiktok] publish failed", initRes.status, JSON.stringify(initData).slice(0, 1200));
  }
  return !!initData?.data?.publish_id;
}

export async function postToLinkedIn(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;
  if (!token || !personId) return false;

  const owner = `urn:li:person:${personId}`;
  const registerRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
        owner,
        serviceRelationships: [{
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent",
        }],
      },
    }),
  });
  if (!registerRes.ok) {
    await reportProviderFailure("linkedin-register", registerRes);
    return false;
  }
  const registerData = await registerRes.json();
  const value = registerData?.value;
  const uploadUrl = value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const asset = value?.asset;
  if (!uploadUrl || !asset) {
    console.error("[social:linkedin-register] upload URL or asset missing");
    return false;
  }

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    await reportProviderFailure("linkedin-video-download", videoRes);
    return false;
  }
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "video/mp4" },
    body: await videoRes.arrayBuffer(),
  });
  if (!uploadRes.ok) {
    await reportProviderFailure("linkedin-upload", uploadRes);
    return false;
  }

  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}`;
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: owner,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "VIDEO",
          media: [{ status: "READY", media: asset, title: { text: script.title } }],
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  await reportProviderFailure("linkedin-publish", res);
  return res.ok;
}

export async function postToInstagram(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_USER_ID;
  if (!token || !igUserId) return false;

  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}`;

  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "REELS", video_url: videoUrl, caption, access_token: token }),
  });

  const container = await containerRes.json();
  if (!containerRes.ok || !container.id) {
    console.error("[social:instagram-container] failed", containerRes.status, JSON.stringify(container).slice(0, 1200));
    return false;
  }

  let ready = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const statusRes = await fetch(`https://graph.facebook.com/v19.0/${container.id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    const status = await statusRes.json();
    if (status?.status_code === "FINISHED") { ready = true; break; }
    if (status?.status_code === "ERROR" || status?.status_code === "EXPIRED") {
      console.error("[social:instagram-status] processing failed", JSON.stringify(status).slice(0, 1200));
      return false;
    }
  }
  if (!ready) {
    console.error("[social:instagram-status] video was not ready before timeout");
    return false;
  }

  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });

  await reportProviderFailure("instagram-publish", publishRes);
  return publishRes.ok;
}

export async function postToTwitter(videoUrl: string, script: VideoScript): Promise<boolean> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) return false;

  const url = "https://api.twitter.com/2/tweets";
  const suffix = videoUrl ? ` ${videoUrl}` : "";
  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}${suffix}`.slice(0, 280);

  const oauthTimestamp = Math.floor(Date.now() / 1000).toString();
  const oauthNonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: oauthNonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: oauthTimestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join("&");

  const baseString = `POST&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const oauthHeader =
    "OAuth " +
    Object.entries({ ...oauthParams, oauth_signature: signature })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: caption }),
  });

  await reportProviderFailure("twitter", res);
  return res.ok;
}

export async function postToFacebook(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) return false;

  const description = `${script.caption}\n\n${script.hashtags.join(" ")}`;

  const res = await fetch(`https://graph-video.facebook.com/v19.0/${pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_url: videoUrl, description, access_token: token }),
  });

  await reportProviderFailure("facebook", res);
  return res.ok;
}

export async function postToThreads(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) return false;

  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}`;

  const containerRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "VIDEO", video_url: videoUrl, text: caption, access_token: token }),
  });

  const container = await containerRes.json();
  if (!container.id) return false;

  const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });

  return publishRes.ok;
}

export async function postToPinterest(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;
  if (!token || !boardId) return false;

  const registerRes = await fetch("https://api.pinterest.com/v5/media", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "video" }),
  });
  if (!registerRes.ok) {
    await reportProviderFailure("pinterest-register", registerRes);
    return false;
  }
  const registration = await registerRes.json();
  const mediaId = registration.media_id;
  const uploadUrl = registration.upload_url;
  const uploadParameters = registration.upload_parameters;
  if (!mediaId || !uploadUrl || !uploadParameters) {
    console.error("[social:pinterest-register] incomplete upload registration");
    return false;
  }

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    await reportProviderFailure("pinterest-video-download", videoRes);
    return false;
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(uploadParameters)) form.append(key, String(value));
  form.append("file", new Blob([await videoRes.arrayBuffer()], { type: "video/mp4" }), "mansa-musa-ai.mp4");
  const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
  if (!uploadRes.ok) {
    await reportProviderFailure("pinterest-upload", uploadRes);
    return false;
  }

  let ready = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const statusRes = await fetch(`https://api.pinterest.com/v5/media/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const status = await statusRes.json();
    if (status.status === "succeeded") { ready = true; break; }
    if (status.status === "failed") {
      console.error("[social:pinterest-status] processing failed", JSON.stringify(status).slice(0, 1200));
      return false;
    }
  }
  if (!ready) {
    console.error("[social:pinterest-status] video was not ready before timeout");
    return false;
  }

  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: script.title,
      description: `${script.caption}\n\n${script.hashtags.join(" ")}`,
      media_source: { source_type: "video_id", media_id: mediaId },
      link: "https://mansamusainitiative.com",
    }),
  });
  await reportProviderFailure("pinterest-publish", res);
  return res.ok;
}

export async function postToYouTube(videoUrl: string, script: VideoScript): Promise<boolean> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return false;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!tokenRes.ok || !accessToken) {
    console.error("[social:youtube-token] refresh failed", tokenRes.status, JSON.stringify(tokenData).slice(0, 1200));
    return false;
  }

  const videoRes = await fetch(videoUrl);
  const videoBuffer = await videoRes.arrayBuffer();

  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}`;
  const metadata = {
    snippet: {
      title: script.title,
      description: caption,
      tags: script.hashtags.map(h => h.replace("#", "")),
      categoryId: "22",
    },
    status: { privacyStatus: "public" },
  };

  const boundary = "ManusMusaAI_boundary";
  const metadataStr = JSON.stringify(metadata);
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadataStr,
    `--${boundary}`,
    "Content-Type: video/mp4",
    "",
    "",
  ].join("\r\n");

  const bodyBytes = new TextEncoder().encode(body);
  const endBytes = new TextEncoder().encode(`\r\n--${boundary}--`);
  const combined = new Uint8Array(bodyBytes.length + videoBuffer.byteLength + endBytes.length);
  combined.set(bodyBytes, 0);
  combined.set(new Uint8Array(videoBuffer), bodyBytes.length);
  combined.set(endBytes, bodyBytes.length + videoBuffer.byteLength);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  await reportProviderFailure("youtube-upload", uploadRes);
  return uploadRes.ok;
}

// ── Text-only fallbacks (no video required) ──────────────────────────────────

export async function postToLinkedInText(script: VideoScript): Promise<boolean> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;
  if (!token || !personId) return false;

  const caption = `${script.script}\n\n${script.hashtags.join(" ")}\n\nhttps://mansamusainitiative.com`;

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  return res.ok;
}

export async function postToFacebookText(script: VideoScript): Promise<boolean> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) return false;

  const message = `${script.script}\n\n${script.hashtags.join(" ")}\n\nhttps://mansamusainitiative.com`;

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
  });

  return res.ok;
}

export async function postToThreadsText(script: VideoScript): Promise<boolean> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) return false;

  const text = `${script.caption}\n\n${script.hashtags.join(" ")}\n\nhttps://mansamusainitiative.com`;

  const containerRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "TEXT", text, access_token: token }),
  });

  const container = await containerRes.json();
  if (!container.id) return false;

  const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });

  return publishRes.ok;
}
