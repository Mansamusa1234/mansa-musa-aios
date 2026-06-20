import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(10).max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = session.user.role === "ADMIN";
  const tickets = await db.supportTicket.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const ticket = await db.supportTicket.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  // Generate AI response asynchronously
  (async () => {
    try {
      const resp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: "You are a helpful support agent for MansaMusaAI, an AI Operating System for business. Answer the user's support query concisely and helpfully. If you cannot resolve the issue, say so clearly and ask them to provide more details.",
        messages: [{ role: "user", content: `Subject: ${parsed.data.subject}\n\n${parsed.data.body}` }],
      });
      const aiResponse = resp.content[0].type === "text" ? resp.content[0].text : "";
      await db.supportTicket.update({ where: { id: ticket.id }, data: { aiResponse, status: "IN_PROGRESS" } });
    } catch (e) {
      console.error("[support] AI response failed:", e);
    }
  })();

  return NextResponse.json({ ticket }, { status: 201 });
}
