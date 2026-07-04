import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, contacts } = await req.json() as {
    campaignId: string;
    contacts: Array<{ name: string; email: string; company?: string; industry?: string }>;
  };

  if (!campaignId || !contacts?.length) {
    return NextResponse.json({ error: "campaignId and contacts required" }, { status: 400 });
  }
  if (contacts.length > 50) {
    return NextResponse.json({ error: "Maximum 50 contacts per batch" }, { status: 400 });
  }

  const campaign = await db.outreachCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, userId: true, subject: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const results: { email: string; success: boolean }[] = [];

  for (const contact of contacts) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `Write a short, natural cold outreach email from Darren Neil, Founder & CEO of MansaMusaAI (mansamusainitiative.com).

Recipient: ${contact.name}${contact.company ? ` at ${contact.company}` : ""}${contact.industry ? ` (${contact.industry} industry)` : ""}
Email: ${contact.email}
Campaign goal: ${campaign.subject}

Requirements:
- 3-4 sentences max, conversational and human — NOT salesy
- Mention a specific pain point relevant to their industry (missing calls, losing leads, staff costs)
- One clear ask: "Would you be open to a quick look?"
- Sign off as Darren Neil, Founder, MansaMusaAI
- No subject line — just the body
- No placeholders like [NAME] — use their actual name: ${contact.name.split(" ")[0]}

Write only the email body, nothing else.`,
        }],
      });

      const draft = response.content[0].type === "text" ? response.content[0].text : "";

      await db.outreachContact.create({
        data: {
          campaignId,
          name: contact.name,
          email: contact.email,
          company: contact.company,
          industry: contact.industry,
          aiDraft: draft,
          status: "PENDING_APPROVAL",
        },
      });

      results.push({ email: contact.email, success: true });
    } catch (err) {
      console.error("[outreach/generate] failed for", contact.email, err);
      results.push({ email: contact.email, success: false });
    }
  }

  return NextResponse.json({ ok: true, generated: results.filter((r) => r.success).length, results });
}
