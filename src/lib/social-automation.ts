/**
 * Social Media Automation
 * Auto-generates scripts, creates HeyGen videos, posts to Instagram/LinkedIn/TikTok
 */

export interface VideoScript {
  title: string;
  script: string;
  caption: string;
  hashtags: string[];
  platform: "instagram" | "linkedin" | "tiktok" | "youtube";
}

// Rotating scripts for Mansa - auto-cycles through these
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

/** Get the next script to post based on day of year */
export function getTodaysScript(platform?: VideoScript["platform"]): VideoScript {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const filtered = platform ? MANSA_SCRIPTS.filter(s => s.platform === platform) : MANSA_SCRIPTS;
  return filtered[dayOfYear % filtered.length];
}

/** Create a HeyGen video from a script */
export async function createHeyGenVideo(script: VideoScript, avatarId: string, voiceId: string): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.error("HEYGEN_API_KEY not set");
    return null;
  }

  const res = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: "normal",
          },
          voice: {
            type: "text",
            input_text: script.script,
            voice_id: voiceId,
          },
        },
      ],
      dimension: { width: 1080, height: 1920 }, // Portrait for TikTok/Reels
      title: script.title,
    }),
  });

  const data = await res.json();
  return data?.data?.video_id ?? null;
}

/** Check HeyGen video status and get download URL */
export async function getHeyGenVideoUrl(videoId: string): Promise<string | null> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": apiKey },
  });

  const data = await res.json();
  if (data?.data?.status === "completed") {
    return data.data.video_url;
  }
  return null;
}

/** Post video to LinkedIn */
export async function postToLinkedIn(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personId = process.env.LINKEDIN_PERSON_ID;
  if (!token || !personId) {
    console.error("LinkedIn credentials not set");
    return false;
  }

  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}`;

  // LinkedIn UGC post with video
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
          shareMediaCategory: "VIDEO",
          media: [
            {
              status: "READY",
              description: { text: script.caption },
              media: videoUrl,
              title: { text: script.title },
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  return res.ok;
}

/** Post to Instagram via Meta Graph API */
export async function postToInstagram(videoUrl: string, script: VideoScript): Promise<boolean> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igUserId = process.env.INSTAGRAM_USER_ID;
  if (!token || !igUserId) {
    console.error("Instagram credentials not set");
    return false;
  }

  const caption = `${script.caption}\n\n${script.hashtags.join(" ")}`;

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: token,
      }),
    }
  );

  const container = await containerRes.json();
  if (!container.id) return false;

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: token,
      }),
    }
  );

  return publishRes.ok;
}
