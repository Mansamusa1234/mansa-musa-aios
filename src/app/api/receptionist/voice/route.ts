import { headers } from "next/headers";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { validateTwilioSignature } from "@/lib/twilio";

const BOOK_APPOINTMENT_TOOL = {
  name: "book_appointment",
  description:
    "Book a calendar appointment for the caller. Only call this once you have the caller's name, a specific requested date and time, and the reason for the appointment.",
  input_schema: {
    type: "object" as const,
    properties: {
      callerName: { type: "string", description: "The caller's full name" },
      startAt: {
        type: "string",
        description: "Requested appointment start date/time as an ISO 8601 datetime string",
      },
      durationMins: {
        type: "number",
        description: "Duration of the appointment in minutes. Defaults to 30 if unknown.",
      },
      reason: { type: "string", description: "Brief reason for the appointment" },
    },
    required: ["callerName", "startAt", "reason"],
  },
};

// Twilio voice webhook — returns TwiML
export async function POST(req: Request) {
  const headersList = await headers();
  const signature = headersList.get("x-twilio-signature") ?? "";
  const url = req.url;

  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((val, key) => { params[key] = val.toString(); });

  if (process.env.NODE_ENV === "production" && !validateTwilioSignature(signature, url, params)) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>`,
      { status: 403, headers: { "Content-Type": "text/xml" } }
    );
  }

  const callSid   = params["CallSid"] ?? "";
  const from      = params["From"] ?? "";
  const to        = params["To"] ?? "";
  const speechResult = params["SpeechResult"] || null;
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
  const nowIso = new Date().toISOString();
  const systemPrompt = `You are ${rec.name}, an AI phone receptionist. Keep responses under 30 words — you're speaking out loud. ${rec.persona}. ${rec.businessHours ? `Business hours: ${rec.businessHours}.` : ""} The current date/time is ${nowIso}. If the caller wants to book an appointment, use the book_appointment tool once you know their name, the requested date/time, and the reason. Confirm or relay any booking result naturally and briefly.`;

  let reply = "Thank you for calling. Could you please repeat that?";
  try {
    const messages: Array<{ role: "user" | "assistant"; content: unknown }> = [
      { role: "user", content: speechResult },
    ];

    let response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      tools: [BOOK_APPOINTMENT_TOOL],
      messages: messages as never,
    });

    // Handle a tool call (e.g. book_appointment) by executing it and sending
    // the result back so the model can produce a natural spoken confirmation.
    while (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find((b) => b.type === "tool_use");
      if (!toolUseBlock || toolUseBlock.type !== "tool_use") break;

      messages.push({ role: "assistant", content: response.content });

      let toolResult: Record<string, unknown>;
      if (toolUseBlock.name === "book_appointment") {
        toolResult = await handleBookAppointment(rec.userId, toolUseBlock.input as Record<string, unknown>);
      } else {
        toolResult = { error: "Unknown tool" };
      }

      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult),
          },
        ],
      });

      response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: systemPrompt,
        tools: [BOOK_APPOINTMENT_TOOL],
        messages: messages as never,
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") reply = textBlock.text;
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

async function handleBookAppointment(
  userId: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const callerName = typeof input.callerName === "string" ? input.callerName.trim() : "";
  const startAtRaw = typeof input.startAt === "string" ? input.startAt : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "Phone appointment";
  const durationMins =
    typeof input.durationMins === "number" && input.durationMins > 0 ? input.durationMins : 30;

  if (!callerName || !startAtRaw) {
    return { success: false, error: "Missing caller name or requested time." };
  }

  const startAt = new Date(startAtRaw);
  if (isNaN(startAt.getTime())) {
    return { success: false, error: "Could not understand the requested date/time." };
  }
  const endAt = new Date(startAt.getTime() + durationMins * 60_000);

  const availability = await db.calendarAvailability.findUnique({ where: { userId } });
  if (!availability) {
    return { success: false, error: "Booking is not available for this business right now." };
  }

  // Conflict check, same approach as the public booking endpoint
  const conflict = await db.calendarBooking.findFirst({
    where: {
      userId,
      status: { not: "CANCELLED" },
      OR: [{ startAt: { lt: endAt }, endAt: { gt: startAt } }],
    },
  });
  if (conflict) {
    return { success: false, error: "That time is no longer available. Please suggest another time." };
  }

  const booking = await db.calendarBooking.create({
    data: {
      userId,
      guestName: callerName,
      guestEmail: "phone-caller@unknown.local",
      title: reason || "Phone appointment",
      notes: reason,
      startAt,
      endAt,
    },
  });

  return {
    success: true,
    bookingId: booking.id,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
  };
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
