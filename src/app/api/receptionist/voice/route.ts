import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";

// Twilio voice webhook — returns TwiML
export async function POST(req: Request) {
  const formData = await req.formData();
  const callSid   = formData.get("CallSid") as string;
  const from      = formData.get("From") as string;
  const to        = formData.get("To") as string;
  const speechResult = formData.get("SpeechResult") as string | null;
  const receptionistId = new URL(req.url).searchParams.get("id");

  if (!receptionistId) {
    return twiml(`<Say voice="Polly.Amy">Sorry, this receptionist is not configured. Goodbye.</Say><Hangup/>`);
  }

  const rec = await db.receptionist.findUnique({ where: { id: receptionistId } });
  if (!rec || !rec.isActive) {
    return twiml(`<Say voice="Polly.Amy">Sorry, the receptionist is currently unavailable. Please try again later.</Say><Hangup/>`);
  }

  // Log the call
  if (!speechResult) {
    await db.voiceCall.create({
      data: { receptionistId, callSid, from, to, status: "answered" },
    }).catch(() => {});

    return twiml(`
      <Say voice="Polly.Amy">${escapeXml(rec.greeting)}</Say>
      <Gather input="speech" action="${voiceUrl(req, receptionistId)}" timeout="5" speechTimeout="auto">
        <Say voice="Polly.Amy">How can I help you today?</Say>
      </Gather>
      <Say voice="Polly.Amy">I didn't catch that. Please call back and try again.</Say>
    `);
  }

  // Generate AI response
  const systemPrompt = `You are ${rec.name}, an AI phone receptionist. Keep responses under 30 words — you're speaking out loud. ${rec.persona}. ${rec.businessHours ? `Business hours: ${rec.businessHours}.` : ""}`;

  let reply = "Thank you for calling. Could you please repeat that?";
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: "user", content: speechResult }],
    });
    if (response.content[0].type === "text") reply = response.content[0].text;
  } catch {}

  await db.voiceCall.updateMany({
    where: { callSid },
    data: { transcript: speechResult, status: "in-progress" },
  });

  const wantsToContinue = !reply.toLowerCase().includes("goodbye") && !reply.toLowerCase().includes("bye");

  if (wantsToContinue) {
    return twiml(`
      <Say voice="Polly.Amy">${escapeXml(reply)}</Say>
      <Gather input="speech" action="${voiceUrl(req, receptionistId)}" timeout="5" speechTimeout="auto">
        <Say voice="Polly.Amy">Is there anything else I can help you with?</Say>
      </Gather>
      <Say voice="Polly.Amy">Thank you for calling. Goodbye!</Say>
    `);
  }

  return twiml(`<Say voice="Polly.Amy">${escapeXml(reply)}</Say><Hangup/>`);
}

function voiceUrl(req: Request, id: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  return `${base}/api/receptionist/voice?id=${id}`;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function twiml(body: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
