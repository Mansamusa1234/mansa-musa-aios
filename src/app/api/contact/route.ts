import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "ai@mansamusainitiative.com";

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(20).max(2000),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.contact, getIP(req));
  if (limited) return limited;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
        <p style="font-weight:700;font-size:18px;margin:0 0 24px">MansaMusaAI — New Contact Form Submission</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#6b7280;width:100px">From</td><td style="padding:8px 0;font-weight:600">${data.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${data.email}" style="color:#6366f1">${data.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Subject</td><td style="padding:8px 0">${data.subject ?? "(no subject)"}</td></tr>
        </table>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap">${data.message}</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Sent via the contact form at mansamusainitiative.com</p>
      </div>`;

    void sendEmail(
      CONTACT_EMAIL,
      `Contact form: ${data.subject ?? `Message from ${data.name}`}`,
      html
    ).catch((err) => console.error("[contact] email failed:", err));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
