import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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
  let metadata: { toEmail?: string; subject?: string } = {};
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
  // Approval alone does not publish social/PR drafts. Never label them SENT.
  return NextResponse.json({ ok: true, status, message: status === "APPROVED" ? "Approved for manual publication. No message or social post was sent." : undefined });
}
