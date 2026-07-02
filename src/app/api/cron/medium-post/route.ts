import { getTodaysScript, VideoScript } from "@/lib/social-automation";
import { withCron } from "@/lib/cronUtils";

function generateArticleHTML(script: VideoScript): string {
  const sentences = script.script.split(/\n/).map((s) => s.trim()).filter(Boolean);
  const opening = sentences.slice(0, 2).join(" ");
  return `
<p>${opening}</p>

<h2>Why UK Businesses Need an AI Receptionist</h2>
<p>In today's competitive market, UK businesses can't afford to miss a single call. Every unanswered phone call is a potential customer walking straight to your competitor. An AI receptionist from Mansa Musa AI ensures your business never misses a lead — answering calls instantly, 24 hours a day, 7 days a week, even during evenings, weekends, and bank holidays.</p>
<p>Whether you run a salon, a trades business, a restaurant, or a professional service, the cost of a missed call far exceeds the cost of automation. Our customers report recouping their monthly subscription in just a single saved booking.</p>

<h2>The Real Cost Savings</h2>
<p>Hiring a full-time receptionist in the UK costs upwards of £22,000 a year in salary alone — before you factor in National Insurance, holiday pay, sick leave, and training. Mansa Musa AI starts at just £49 a month, with no contracts and no hidden fees.</p>
<p>That's less than £2 a day for a receptionist who never calls in sick, never takes a lunch break, never misses a call, and works every single day of the year.</p>

<h2>How It Works</h2>
<p>Getting started with Mansa Musa AI takes minutes, not weeks. Once set up, your AI receptionist answers every inbound call using natural, conversational AI. It can book appointments directly into your calendar, capture lead details, answer common questions about your business, and send automatic follow-up messages via WhatsApp or SMS.</p>

<h2>Ready to Get Started?</h2>
<p>Join hundreds of UK businesses already using Mansa Musa AI to capture more leads and grow their revenue — without adding headcount. Visit <a href="https://mansamusainitiative.com">mansamusainitiative.com</a> for a free trial. No credit card required.</p>
`.trim();
}

export const GET = withCron(async () => {
  const token = process.env.MEDIUM_INTEGRATION_TOKEN;
  if (!token) return { skipped: true, reason: "MEDIUM_INTEGRATION_TOKEN not configured" };

  const meRes = await fetch("https://api.medium.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) throw new Error(`Medium /me failed: ${meRes.status}`);

  const meData = (await meRes.json()) as { data: { id: string } };
  const script = getTodaysScript();

  const postRes = await fetch(`https://api.medium.com/v1/users/${meData.data.id}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: script.title,
      contentFormat: "html",
      content: generateArticleHTML(script),
      tags: script.hashtags.map((h) => h.replace("#", "")).slice(0, 5),
      publishStatus: "public",
      canonicalUrl: "https://mansamusainitiative.com",
    }),
  });
  if (!postRes.ok) throw new Error(`Medium post creation failed: ${postRes.status}`);

  const postData = (await postRes.json()) as { data: { id: string; url: string } };
  return { title: script.title, url: postData.data.url };
});
