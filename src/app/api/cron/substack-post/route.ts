import { NextResponse } from "next/server";
import { getTodaysScript, VideoScript } from "@/lib/social-automation";

function generateNewsletterHTML(script: VideoScript): string {
  const topic = script.title;
  const hook = script.script.split("\n")[0];

  return `<p>Hi {{first_name}},</p>

<p>${hook}</p>

<p>As a UK business owner, you know how hard it is to be everywhere at once. You're serving customers, managing staff, handling suppliers — and your phone is ringing. Again. The truth is, most small businesses lose more revenue to missed calls than they realise. Research shows that 80% of callers who reach voicemail simply hang up and call your competitor instead. They're not waiting for a callback. They've already moved on.</p>

<p>The businesses that are winning right now have solved this problem — not by hiring more staff, but by using AI to handle the calls they can't. An AI receptionist answers every call instantly, books appointments directly into your calendar, captures lead details, and sends automatic follow-ups. It works at 2am on a bank holiday just as well as it does at 9am on a Monday. And it costs a fraction of what you'd pay a part-time receptionist.</p>

<p>This week's insight: <strong>${topic}</strong>. The most successful UK businesses we work with didn't wait until they had a "phone problem" to act — they got ahead of it. Whether you run a salon, a trade business, a restaurant, or a professional service, your phone is your most important sales channel. Treat it like one.</p>

<p>If you haven't already automated your inbound calls and messages, now is the time. Your competitors are doing it. Your customers expect an instant response. And the technology to make it happen is already here — and affordable.</p>

<p><strong>Start your free trial at <a href="https://mansamusainitiative.com">mansamusainitiative.com</a></strong> — no contract, no setup fee, and you'll be live within 24 hours.</p>

<p>Until next week,</p>
<p><strong>Darren Neil, Founder — MansaMusaAI</strong></p>`;
}

export async function GET(req: Request) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionCookie = process.env.SUBSTACK_SESSION_COOKIE;
  const publication = process.env.SUBSTACK_PUBLICATION;

  if (!sessionCookie || !publication) {
    return NextResponse.json(
      { error: "Missing SUBSTACK_SESSION_COOKIE or SUBSTACK_PUBLICATION env vars" },
      { status: 500 }
    );
  }

  const baseUrl = `https://${publication}.substack.com/api/v1`;
  const script = getTodaysScript();
  const draftTitle = script.title;
  const draftSubtitle = script.caption;
  const draftBody = generateNewsletterHTML(script);

  const cookies = `substack.sid=${sessionCookie}`;

  // Step 1: Create draft
  const draftRes = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
    },
    body: JSON.stringify({
      type: "newsletter",
      draft_title: draftTitle,
      draft_body: draftBody,
      draft_subtitle: draftSubtitle,
      audience: "everyone",
    }),
  });

  if (!draftRes.ok) {
    const errText = await draftRes.text();
    console.error("[cron/substack-post] Draft creation failed", draftRes.status, errText);
    return NextResponse.json({ error: "Failed to create Substack draft" }, { status: 500 });
  }

  const draft = await draftRes.json() as { id: number; slug?: string };
  const postId = draft.id;

  // Step 3: Update draft (PUT) then publish
  const updateRes = await fetch(`${baseUrl}/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
    },
    body: JSON.stringify({
      draft_title: draftTitle,
      draft_body: draftBody,
      draft_subtitle: draftSubtitle,
      audience: "everyone",
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error("[cron/substack-post] Draft update failed", updateRes.status, errText);
    return NextResponse.json({ error: "Failed to update Substack draft before publish" }, { status: 500 });
  }

  const publishRes = await fetch(`${baseUrl}/posts/${postId}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
    },
    body: JSON.stringify({}),
  });

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    console.error("[cron/substack-post] Publish failed", publishRes.status, errText);
    return NextResponse.json({ error: "Failed to publish Substack post" }, { status: 500 });
  }

  const postSlug = draft.slug ?? postId.toString();
  const postUrl = `https://${publication}.substack.com/p/${postSlug}`;

  return NextResponse.json({
    ok: true,
    title: draftTitle,
    url: postUrl,
    timestamp: new Date().toISOString(),
  });
}
