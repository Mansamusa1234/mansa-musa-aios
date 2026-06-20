import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendEmail, newLeadEmailHtml } from "@/lib/email";
import { triggerWorkflows } from "@/lib/email-automation";

const schema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { userId, name, email, phone, company, message } = parsed.data;

  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.lead.create({
    data: {
      userId,
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      source: "capture-page",
      notes: message || null,
      stage: "NEW",
    },
  });

  // Trigger email automation workflows for the business owner
  if (email) void triggerWorkflows(userId, "LEAD_CREATED", { email, name }).catch(() => {});

  // Notify business owner — fire and forget
  void sendEmail(
    user.email,
    `New lead: ${name}`,
    newLeadEmailHtml({ name, email, phone, company, message, source: "lead capture page" })
  ).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
