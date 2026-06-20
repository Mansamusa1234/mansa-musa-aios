import { anthropic } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendEmail, newLeadEmailHtml } from "@/lib/email";

export async function POST(req: Request) {
  const { receptionistId, messages, visitorName, visitorEmail } = await req.json();
  if (!receptionistId) return NextResponse.json({ error: "Missing receptionistId" }, { status: 400 });

  const rec = await db.receptionist.findUnique({ where: { id: receptionistId } });
  if (!rec || !rec.isActive) return NextResponse.json({ error: "Receptionist not found or inactive" }, { status: 404 });

  const systemPrompt = `You are ${rec.name}, an AI receptionist for this business. Your personality: ${rec.persona}. Greet visitors warmly, answer questions about the business, collect contact details when appropriate, and offer to schedule appointments or escalate to a human. Always be ${rec.persona}. Keep responses concise (2-4 sentences max). Never make up specific details about the business you don't know.${rec.businessHours ? ` Business hours: ${rec.businessHours}.` : ""}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt,
    messages: messages.slice(-10),
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  await db.receptionist.update({ where: { id: receptionistId }, data: { totalChats: { increment: 1 } } }).catch(() => {});
  await db.receptionistChat.create({
    data: {
      receptionistId,
      visitorName,
      visitorEmail,
      messages: JSON.stringify(messages),
    },
  }).catch(() => {});

  // When visitor provides contact info, create a CRM lead (once) and notify the owner
  if (visitorName && visitorEmail) {
    (async () => {
      try {
        const existing = await db.lead.findFirst({ where: { userId: rec.userId, email: visitorEmail } });
        if (!existing) {
          await db.lead.create({ data: { userId: rec.userId, name: visitorName, email: visitorEmail, source: "receptionist-widget", stage: "NEW" } });
          const owner = await db.user.findUnique({ where: { id: rec.userId }, select: { email: true } });
          if (owner) {
            void sendEmail(owner.email, `New lead via receptionist: ${visitorName}`, newLeadEmailHtml({ name: visitorName, email: visitorEmail, source: "AI receptionist widget" }));
          }
        }
      } catch {}
    })();
  }

  return NextResponse.json({ reply });
}
