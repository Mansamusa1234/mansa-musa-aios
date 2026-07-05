import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { withCron } from "@/lib/cronUtils";

export const GET = withCron(async () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const leads = await db.lead.findMany({
    where: {
      email: { not: null },
      createdAt: { gte: since },
      stage: "NEW",
    },
    take: 20,
  });

  const existingMeta = await db.contentQueue.findMany({
    where: { type: "lead_followup", status: { in: ["PENDING", "APPROVED", "SENT"] } },
    select: { metadata: true },
  });
  const existingLeadIds = new Set(
    existingMeta.map((m) => {
      try { const v = m.metadata; return (typeof v === "object" && v !== null && !Array.isArray(v)) ? (v as Record<string, unknown>).leadId : null; } catch { return null; }
    }).filter(Boolean)
  );

  const newLeads = leads.filter((l) => !existingLeadIds.has(l.id));
  const results: { leadId: string; success: boolean }[] = [];

  for (const lead of newLeads) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 350,
        messages: [{
          role: "user",
          content: `Write a warm, human follow-up email from Darren Neil, Founder of MansaMusaAI to a new lead.

Lead name: ${lead.name}
Company: ${lead.company ?? "their business"}
Source: ${lead.source ?? "our website"}

The lead just enquired about MansaMusaAI — an AI receptionist and business automation platform.

Write a 3-4 sentence reply:
- Thank them for reaching out
- Mention one specific benefit relevant to their type of business
- Offer a free 15-minute demo call
- Keep it warm and conversational, not corporate

Sign off as Darren Neil, Founder, MansaMusaAI
Email body only, no subject line.`,
        }],
      });

      const draft = response.content[0].type === "text" ? response.content[0].text : "";

      await db.contentQueue.create({
        data: {
          type: "lead_followup",
          title: `Follow-up to ${lead.name}`,
          content: draft,
          status: "PENDING",
          metadata: JSON.stringify({ leadId: lead.id, toEmail: lead.email, toName: lead.name }),
        },
      });

      results.push({ leadId: lead.id, success: true });
    } catch (err) {
      console.error("[cron/lead-followup] failed for lead", lead.id, err);
      results.push({ leadId: lead.id, success: false });
    }
  }

  return { drafted: results.filter((r) => r.success).length, results };
});
