import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

async function publishContent(item: { id: string; type: string; platform: string | null; content: string; title: string; metadata: string | null }) {
  const meta = item.metadata ? JSON.parse(item.metadata) : {};

  if (item.type === "lead_followup" && meta.toEmail) {
    await sendEmail(meta.toEmail, item.title, `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px"><p style="font-size:16px;line-height:1.7;color:#1e293b;white-space:pre-wrap">${item.content}</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"><p style="color:#64748b;font-size:13px">MansaMusaAI · mansamusainitiative.com</p></div>`);
    return;
  }

  if (item.type === "email" && meta.toEmail) {
    await sendEmail(meta.toEmail, item.title, `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px"><p style="font-size:16px;line-height:1.7;color:#1e293b;white-space:pre-wrap">${item.content}</p></div>`);
    return;
  }

  console.log(`[content-queue] social post approved for ${item.platform}:`, item.title);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, content } = await req.json() as { action: "approve" | "reject" | "edit"; content?: string };

  const item = await db.contentQueue.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "reject") {
    await db.contentQueue.update({ where: { id }, data: { status: "REJECTED", rejectedAt: new Date() } });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  if (action === "edit" && content) {
    await db.contentQueue.update({ where: { id }, data: { content } });
    return NextResponse.json({ ok: true, status: "EDITED" });
  }

  if (action === "approve") {
    await publishContent({ ...item, content: content ?? item.content, metadata: item.metadata != null ? JSON.stringify(item.metadata) : null });
    await db.contentQueue.update({ where: { id }, data: { status: "SENT", approvedAt: new Date(), sentAt: new Date(), ...(content ? { content } : {}) } });
    return NextResponse.json({ ok: true, status: "SENT" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
