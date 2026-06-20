import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { validateTwilioSignature, sendWhatsApp } from "@/lib/twilio";
import { anthropic } from "@/lib/anthropic";

export async function POST(req: Request) {
  const headersList = await headers();
  const signature = headersList.get("x-twilio-signature") ?? "";
  const url = req.url;

  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((val, key) => { params[key] = val.toString(); });

  if (process.env.NODE_ENV === "production" && !validateTwilioSignature(signature, url, params)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from   = params["From"] ?? "";
  const body   = params["Body"] ?? "";
  const twilioSid = params["MessageSid"] ?? undefined;

  // Find the user who owns this WhatsApp number, or fall back to first admin
  const phoneDigits = from.replace(/\D/g, "").slice(-10);
  let owner = await db.user.findFirst({
    where: { OR: [{ email: { contains: phoneDigits } }] },
    select: { id: true, name: true },
  });
  if (!owner) {
    owner = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, name: true } });
  }
  if (!owner) {
    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }

  // Store inbound message
  await db.whatsAppMessage.create({
    data: {
      userId: owner.id,
      from,
      to: params["To"] ?? "",
      body,
      direction: "INBOUND",
      twilioSid,
    },
  });

  // Also create a CRM lead if we don't have one for this number
  const existingLead = await db.lead.findFirst({
    where: { userId: owner.id, phone: { contains: phoneDigits } },
  });
  if (!existingLead && body.length > 0) {
    await db.lead.create({
      data: {
        userId: owner.id,
        name: params["ProfileName"] || `WhatsApp ${from}`,
        phone: from,
        source: "whatsapp",
        stage: "NEW",
        notes: `First message: ${body}`,
      },
    });
  }

  // Get receptionist config for this user
  const receptionist = await db.receptionist.findUnique({
    where: { userId: owner.id },
    select: { name: true, persona: true, greeting: true },
  });

  const systemPrompt = receptionist
    ? `You are ${receptionist.name}, an AI receptionist. Persona: ${receptionist.persona}. Be helpful, concise, and professional. Keep replies under 160 words for WhatsApp.`
    : "You are an AI receptionist. Be helpful, concise, and professional. Keep replies under 160 words for WhatsApp.";

  // Generate AI reply
  let aiReply = receptionist?.greeting ?? "Hello! How can I help you today?";
  try {
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: body }],
    });
    aiReply = completion.content[0].type === "text" ? completion.content[0].text : aiReply;
  } catch {
    // fallback to greeting
  }

  // Send reply and store outbound
  try {
    const outSid = await sendWhatsApp(from, aiReply);
    await db.whatsAppMessage.create({
      data: {
        userId: owner.id,
        from: params["To"] ?? "",
        to: from,
        body: aiReply,
        direction: "OUTBOUND",
        twilioSid: outSid,
      },
    });
  } catch (err) {
    console.error("[whatsapp] send failed:", err);
  }

  return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
}
