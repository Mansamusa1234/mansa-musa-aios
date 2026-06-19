import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
export const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886";

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!accountSid || !authToken) throw new Error("Twilio credentials not configured");
  if (!_client) _client = twilio(accountSid, authToken);
  return _client;
}

export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const client = getClient();
  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const msg = await client.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to: toFormatted,
    body,
  });
  return msg.sid;
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
