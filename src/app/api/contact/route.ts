import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { after } from "next/server";
import { db } from "@/lib/db";
import { newLeadEmailHtml, sendEmail } from "@/lib/email";

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(20).max(2000),
  company: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  offering: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.publicWrite, getIP(req));
  if (limited) return limited;

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const admin = await db.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true },
    });
    const offering = data.offering ?? data.subject ?? "general enquiry";
    const notes = [
      data.subject ? `Subject: ${data.subject}` : null,
      data.size ? `Team size: ${data.size}` : null,
      data.message,
    ].filter(Boolean).join("\n\n");

    if (admin) {
      await db.lead.create({
        data: {
          userId: admin.id,
          name: data.name,
          email: data.email,
          company: data.company ?? null,
          source: `website:${offering}`.slice(0, 100),
          notes,
          stage: "NEW",
        },
      });
    }

    const notificationEmail = admin?.email ?? process.env.SALES_EMAIL ?? "sales@mansamusainitiative.com";
    after(async () => {
      await sendEmail(
        notificationEmail,
        `New revenue lead: ${offering}`,
        newLeadEmailHtml({
          name: data.name,
          email: data.email,
          company: data.company,
          message: notes,
          source: offering,
        })
      ).catch((error) => console.error("[contact] notification failed:", error));
    });

    console.info(JSON.stringify({ level: "info", message: "contact_form_received", offering, persisted: Boolean(admin) }));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
