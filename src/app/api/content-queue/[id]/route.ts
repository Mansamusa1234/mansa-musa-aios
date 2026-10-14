import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isMetricoolConfigured, metricoolDraftMode, schedulePost, utmLink, SOCIAL_NETWORKS, type SocialNetwork } from "@/lib/metricool";

const schema = z.object({ action: z.enum(["approve", "reject", "edit"]), content: z.string().min(1).max(50000).optional() });
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid queue action or content." }, { status: 400 });
  const { id } = await params;
  const { action, content } = parsed.data;
  const item = await db.contentQueue.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status !== "PENDING") return NextResponse.json({ error: "This item has already been processed. Refresh the queue." }, { status: 409 });
  if (action === "edit" && !content) return NextResponse.json({ error: "Content is required." }, { status: 400 });
  let metadata: { toEmail?: string; subject?: string; kind?: string; videoId?: string | null; videoUrl?: string | null; networks?: string[] } = {};
  try { metadata = JSON.parse(item.metadata ?? "{}"); } catch {
    return NextResponse.json({ error: "Item metadata is invalid. Repair the draft before approval." }, { status: 400 });
  }
  const sendsEmail = ["email", "lead_followup", "cold_outreach"].includes(item.type) && !!metadata?.toEmail;
  if (action === "approve" && ["email", "lead_followup"].includes(item.type) && !sendsEmail) {
    return NextResponse.json({ error: "No recipient is configured for this email draft." }, { status: 400 });
  }
  if (action === "approve" && sendsEmail && !z.string().email().safeParse(metadata.toEmail).success) {
    return NextResponse.json({ error: "The recipient email is invalid." }, { status: 400 });
  }
  const dailyVideo = item.type === "social_post" && metadata.kind === "daily_video";
  if (action === "approve" && dailyVideo && metadata.videoId && !metadata.videoUrl) {
    return NextResponse.json({ error: "The video is still rendering. Approve it once the video is attached." }, { status: 409 });
  }
  const status = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "PENDING";
  // Claim the pending draft atomically: double clicks cannot send it twice.
  const claimed = await db.contentQueue.updateMany({
    where: { id, status: "PENDING", updatedAt: item.updatedAt },
    data: { status, ...(action === "approve" ? { approvedAt: new Date() } : {}), ...(action === "reject" ? { rejectedAt: new Date() } : {}), ...(content ? { content } : {}) },
  });
  if (!claimed.count) return NextResponse.json({ error: "This draft changed. Refresh before trying again." }, { status: 409 });
  if (action === "approve" && sendsEmail) {
    const result = await sendEmail(metadata.toEmail!, metadata.subject ?? item.title,
      `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px"><p style="white-space:pre-wrap">${escapeHtml(content ?? item.content)}</p></div>`, undefined, `queue-${id}`);
    if (!result.sent) {
      await db.contentQueue.update({ where: { id }, data: { status: "PENDING", approvedAt: null } });
      return NextResponse.json({ error: result.reason ?? "Email was not accepted by the provider. The draft remains pending." }, { status: 502 });
    }
    await db.contentQueue.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
    return NextResponse.json({ ok: true, status: "SENT" });
  }
  if (action === "approve" && dailyVideo && isMetricoolConfigured()) {
    const text = content ?? item.content;
    // Video-only networks are skipped when there is no video; Facebook accepts text.
    const networks = (metadata.networks ?? [...SOCIAL_NETWORKS])
      .filter((n): n is SocialNetwork => (SOCIAL_NETWORKS as readonly string[]).includes(n))
      .filter((n) => metadata.videoUrl || n === "facebook");
    const when = nextLondonSlot();
    const results = [];
    for (const network of networks) {
      results.push(await schedulePost({ network, text: `${text}\n\n${utmLink(network, id)}`, mediaUrl: metadata.videoUrl, dateTime: when, timezone: "Europe/London" }));
    }
    const scheduled = results.filter((r) => r.ok);
    if (!scheduled.length) {
      await db.contentQueue.update({ where: { id }, data: { status: "PENDING", approvedAt: null } });
      return NextResponse.json({ error: "Metricool did not accept any post. The draft remains pending.", results }, { status: 502 });
    }
    await db.contentQueue.update({ where: { id }, data: { metadata: JSON.stringify({ ...metadata, metricool: { scheduledFor: when, draft: metricoolDraftMode(), results } }) } });
    return NextResponse.json({ ok: true, status: "APPROVED", scheduledFor: when, metricoolDraft: metricoolDraftMode(), results,
      message: metricoolDraftMode() ? "Saved as Metricool drafts for a final check. Nothing was published." : `Scheduled in Metricool for ${when} (Europe/London).` });
  }
  // Approval alone does not publish social/PR drafts. Never label them SENT.
  return NextResponse.json({ ok: true, status, message: status === "APPROVED" ? "Approved for manual publication. No message or social post was sent." : undefined });
}

/** Next 18:00 Europe/London slot as a local ISO string (Metricool takes the timezone separately). */
function nextLondonSlot(now = new Date()): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false })
    .formatToParts(now).map((p) => [p.type, p.value]));
  const day = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + (Number(parts.hour) >= 17 ? 1 : 0)));
  return `${day.toISOString().slice(0, 10)}T18:00:00`;
}
