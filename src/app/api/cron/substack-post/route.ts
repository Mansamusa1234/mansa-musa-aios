import { getTodaysScript, VideoScript } from "@/lib/social-automation";
import { withCron } from "@/lib/cronUtils";

function generateNewsletterHTML(script: VideoScript): string {
  const topic = script.title;
  const hook = script.script.split("\n")[0];
  return `<p>Hi {{first_name}},</p>

<p>${hook}</p>

<p>As a UK business owner, you can't reply to every enquiry the moment it arrives. Mansa Musa AI gives you an AI receptionist for your website chat that answers questions about your business, captures enquirers' details into your CRM. A booking calendar lets clients book appointments.</p>

<p>This week's topic: <strong>${topic}</strong>.</p>

<p>There is a free plan with 5 AI chats a day. Paid plans are Starter at £49 a month, Professional at £149 a month and Enterprise at £499 a month. Verify your email and you can try Professional free for 14 days with no card.</p>

<p><strong>Start free at <a href="https://mansamusainitiative.com">mansamusainitiative.com</a></strong></p>

<p>Until next week,</p>
<p><strong>Darren Neil, Founder — MansaMusaAI</strong></p>`;
}

export const GET = withCron(async () => {
  const sessionCookie = process.env.SUBSTACK_SESSION_COOKIE;
  const publication = process.env.SUBSTACK_PUBLICATION;

  if (!sessionCookie || !publication) {
    return { skipped: true, reason: "SUBSTACK_SESSION_COOKIE or SUBSTACK_PUBLICATION not configured" };
  }

  const baseUrl = `https://${publication}.substack.com/api/v1`;
  const script = getTodaysScript();
  const cookies = `substack.sid=${sessionCookie}`;

  const draftRes = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({
      type: "newsletter",
      draft_title: script.title,
      draft_body: generateNewsletterHTML(script),
      draft_subtitle: script.caption,
      audience: "everyone",
    }),
  });

  if (!draftRes.ok) {
    const errText = await draftRes.text();
    // Substack does not provide a supported public publishing API and its
    // private endpoint can disappear. Treat a missing endpoint as unavailable
    // instead of repeatedly crashing the entire scheduled-job run.
    if (draftRes.status === 404) {
      console.warn("[cron/substack-post] publishing endpoint unavailable (404)");
      return {
        skipped: true,
        reason: "Substack publishing endpoint unavailable",
      };
    }
    throw new Error(`Substack draft creation failed ${draftRes.status}: ${errText.slice(0, 200)}`);
  }

  const draft = await draftRes.json() as { id: number; slug?: string };

  const updateRes = await fetch(`${baseUrl}/posts/${draft.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({
      draft_title: script.title,
      draft_body: generateNewsletterHTML(script),
      draft_subtitle: script.caption,
      audience: "everyone",
    }),
  });
  if (!updateRes.ok) throw new Error(`Substack update failed ${updateRes.status}`);

  // Draft only: publishing a Substack post emails every subscriber, so the owner reviews and sends it
  // from Substack. Nothing is published or emailed automatically.
  return {
    title: script.title,
    draftId: draft.id,
    status: "draft",
  };
});
