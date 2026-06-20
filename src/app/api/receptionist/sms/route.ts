import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";

// Twilio SMS webhook
export async function POST(req: Request) {
  const formData = await req.formData();
  const from     = formData.get("From") as string;
  const body     = formData.get("Body") as string;
  const to       = formData.get("To") as string;

  // Find receptionist by Twilio number
  const rec = await db.receptionist.findFirst({
    where: { twilioNumber: to, isActive: true },
  });

  if (!rec) {
    return smsReply("Sorry, this number is not currently active.");
  }

  // Get recent message history from WhatsApp messages (reuse the same table)
  const recent = await db.whatsAppMessage.findMany({
    where: { userId: rec.userId, from },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const history = recent.reverse().map((m) => ({
    role: m.direction === "INBOUND" ? "user" as const : "assistant" as const,
    content: m.body,
  }));

  history.push({ role: "user", content: body });

  const systemPrompt = `You are ${rec.name}, an AI receptionist responding via SMS. Keep responses under 160 characters when possible — this is SMS. ${rec.persona}. ${rec.businessHours ? `Business hours: ${rec.businessHours}.` : ""}`;

  let reply = "Thank you for your message. We'll be in touch shortly.";
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages: history,
    });
    if (response.content[0].type === "text") reply = response.content[0].text;
  } catch {}

  // Log inbound + outbound
  await db.whatsAppMessage.createMany({
    data: [
      { userId: rec.userId, from, to, body, direction: "INBOUND", status: "received" },
      { userId: rec.userId, from: to, to: from, body: reply, direction: "OUTBOUND", status: "sent" },
    ],
  }).catch(() => {});

  // Try to send via Twilio SDK
  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    await client.messages.create({ body: reply, from: to, to: from });
  } catch {}

  return smsReply(reply);
}

function smsReply(message: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
