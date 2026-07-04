import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactIds, action } = await req.json() as {
    contactIds: string[];
    action: "approve" | "reject";
  };

  if (!contactIds?.length) return NextResponse.json({ error: "contactIds required" }, { status: 400 });

  if (action === "reject") {
    await db.outreachContact.updateMany({
      where: { id: { in: contactIds }, campaign: { userId: session.user.id } },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ ok: true, action: "rejected", count: contactIds.length });
  }

  // Approve and send — only contacts belonging to the calling user
  const contacts = await db.outreachContact.findMany({
    where: { id: { in: contactIds }, status: "PENDING_APPROVAL", campaign: { userId: session.user.id } },
    include: { campaign: true },
  });

  const results: { id: string; success: boolean }[] = [];

  for (const contact of contacts) {
    try {
      if (!contact.aiDraft) continue;

      const unsubEmail = encodeURIComponent(contact.email);
      const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
  <p style="color:#1e293b;font-size:16px;line-height:1.7;white-space:pre-wrap">${contact.aiDraft}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
  <p style="color:#64748b;font-size:13px">MansaMusaAI · <a href="https://mansamusainitiative.com" style="color:#7c3aed">mansamusainitiative.com</a></p>
  <p style="color:#94a3b8;font-size:11px;margin-top:16px">You received this because your contact details were submitted as a potential business match. <a href="https://mansamusainitiative.com/unsubscribe?email=${unsubEmail}" style="color:#94a3b8">Unsubscribe</a></p>
</div>
</body></html>`;

      await sendEmail(contact.email, contact.campaign.subject, htmlBody);

      await db.outreachContact.update({
        where: { id: contact.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      await db.outreachCampaign.update({
        where: { id: contact.campaignId },
        data: { sentCount: { increment: 1 } },
      });

      results.push({ id: contact.id, success: true });
    } catch (err) {
      console.error("[outreach/approve] send failed for", contact.email, err);
      await db.outreachContact.update({
        where: { id: contact.id },
        data: { status: "FAILED" },
      });
      results.push({ id: contact.id, success: false });
    }
  }

  return NextResponse.json({ ok: true, sent: results.filter((r) => r.success).length, results });
}
