import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { completeText } from "@/lib/aiText";
import { CSUITE_BY_ROLE } from "@/lib/csuiteAgents";
import type { CsuiteRole } from "@/lib/csuiteAgents";
import { getActivePlan, hasFeature } from "@/lib/subscription";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { z } from "zod";

const postSchema = z.object({
  role: z.string().max(40),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(8_000),
  })).min(1).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasFeature(await getActivePlan(session.user.id), "workforce_csuite")) {
    return NextResponse.json({ error: "Your AI executive team is available on the Starter plan and above." }, { status: 403 });
  }

  const limited = await checkRateLimit(limiters.chat, session.user.id);
  if (limited) return limited;

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid chat request" }, { status: 400 });
  const role = parsed.data.role as CsuiteRole;
  const messages = parsed.data.messages;
  if (messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Invalid chat request" }, { status: 400 });
  }

  const agent = Object.hasOwn(CSUITE_BY_ROLE, role) ? CSUITE_BY_ROLE[role] : undefined;
  if (!agent) return NextResponse.json({ error: "Unknown agent role" }, { status: 400 });

  let reply: string;
  try {
    ({ text: reply } = await completeText({ anthropicModel: "claude-sonnet-4-6", maxTokens: 1024, system: agent.systemPrompt, messages: messages.slice(-20) }));
  } catch (err) {
    console.error("[workforce/chat] AI request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Your AI executive is unavailable right now. Please try again shortly." }, { status: 503 });
  }

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
