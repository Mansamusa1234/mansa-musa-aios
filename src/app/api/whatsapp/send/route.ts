import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/twilio";
import { z } from "zod";

const schema = z.object({
  to:   z.string().min(7).max(20),
  body: z.string().min(1).max(1600),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 422 });

  const { to, body } = parsed.data;

  try {
    const sid = await sendWhatsApp(to, body);
    await db.whatsAppMessage.create({
      data: {
        userId: session.user.id,
        from: process.env.TWILIO_WHATSAPP_NUMBER ?? "",
        to,
        body,
        direction: "OUTBOUND",
        twilioSid: sid,
      },
    });
    return NextResponse.json({ sid }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1"));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50"));

  const [messages, total] = await Promise.all([
    db.whatsAppMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.whatsAppMessage.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ messages, total, page, limit });
}
