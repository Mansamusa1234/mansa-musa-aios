import { getTodaysScript, VideoScript } from "@/lib/social-automation";
import { withCron } from "@/lib/cronUtils";

function generateArticleHTML(script: VideoScript): string {
  const sentences = script.script.split(/\n/).map((s) => s.trim()).filter(Boolean);
  const opening = sentences.slice(0, 2).join(" ");
  return `
<p>${opening}</p>

<h2>Why UK Businesses Use an AI Receptionist</h2>
<p>Small businesses lose enquiries when nobody is free to reply. Mansa Musa AI gives you an AI receptionist for your website chat: it answers questions about your business, captures the enquirer's details into your CRM. A booking calendar lets clients book appointments.</p>

<h2>What It Costs</h2>
<p>There is a free plan with 5 AI chats a day. Paid plans are Starter at £49 a month, Professional at £149 a month and Enterprise at £499 a month. Verify your email and you can try Professional free for 14 days with no card.</p>

<h2>What You Get</h2>
<p>Starter includes the website chat AI receptionist, lead capture with a CRM, appointment booking and an AI executive team for strategy, sales, finance and marketing questions. Professional adds email automation sequences and the Business Research Desk.</p>

<h2>Get Started</h2>
<p>Visit <a href="https://mansamusainitiative.com">mansamusainitiative.com</a> to start free.</p>
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
      // Draft only: the owner reviews and publishes on Medium. Nothing goes public automatically.
      publishStatus: "draft",
      canonicalUrl: "https://mansamusainitiative.com",
    }),
  });
  if (!postRes.ok) throw new Error(`Medium post creation failed: ${postRes.status}`);

  const postData = (await postRes.json()) as { data: { id: string; url: string } };
  return { title: script.title, url: postData.data.url };
});
