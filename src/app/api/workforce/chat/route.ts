import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { CSUITE_BY_ROLE } from "@/lib/csuiteAgents";
import type { CsuiteRole } from "@/lib/csuiteAgents";
import { checkRateLimit, limiters } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.workforceChat, session.user.id);
  if (limited) return limited;

  const { role, messages } = await req.json() as {
    role: CsuiteRole;
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const agent = CSUITE_BY_ROLE[role];
  if (!agent) return NextResponse.json({ error: "Unknown agent role" }, { status: 400 });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: agent.systemPrompt,
    messages: messages.slice(-20),
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  // Persist conversation (upsert by userId + role)
  const existing = await db.workforceChat.findFirst({
    where: { userId: session.user.id, agentRole: role },
  });

  const updatedMessages = [...messages, { role: "assistant" as const, content: reply }];

  if (existing) {
    await db.workforceChat.update({
      where: { id: existing.id },
      data: { messages: JSON.stringify(updatedMessages) },
    });
  } else {
    await db.workforceChat.create({
      data: {
        userId: session.user.id,
        agentRole: role,
        messages: JSON.stringify(updatedMessages),
      },
    });
  }

  return NextResponse.json({ reply });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as CsuiteRole | null;
  if (!role) return NextResponse.json({ error: "Missing role" }, { status: 400 });

  const chat = await db.workforceChat.findFirst({
    where: { userId: session.user.id, agentRole: role },
  });

  const messages = chat ? (JSON.parse(chat.messages) as { role: string; content: string }[]) : [];
  return NextResponse.json({ messages });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  await db.workforceChat.deleteMany({
    where: { userId: session.user.id, ...(role ? { agentRole: role } : {}) },
  });

  return NextResponse.json({ success: true });
}
