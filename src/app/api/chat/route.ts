import { auth } from "@/lib/auth";
import { SYSTEM_PROMPT, buildAgentSystemPrompt } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { PLANS } from "@/lib/stripe";
import { getActivePlan } from "@/lib/subscription";
import { AGENTS } from "@/data/agents";
import { resolveModel, routeMessage } from "@/lib/modelRouter";
import { findDictionaryEntriesInText, formatDictionaryEntriesForPrompt, formatDictionarySources } from "@/lib/legalDictionary";
import { sendEmail, usageLimitWarningEmailHtml } from "@/lib/email";
import { NextResponse } from "next/server";
import { after } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await checkRateLimit(limiters.chat, session.user.id);
  if (limited) return limited;

  const { conversationId, message } = await req.json();
  if (!conversationId || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.message.create({
    data: { conversationId, role: "user", content: message },
  });

  if (conversation.title === "New Conversation") {
    await db.conversation.update({
      where: { id: conversationId },
      data: { title: message.slice(0, 60) },
    });
  }

  const history = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const plan = await getActivePlan(session.user.id);

  const planDef = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  if (planDef.messagesPerDay) {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgCount = await db.usageRecord.count({
      where: { userId: session.user.id, createdAt: { gte: dayStart } },
    });
    if (msgCount >= planDef.messagesPerDay) {
      return NextResponse.json({
        error: "MESSAGE_LIMIT_REACHED",
        limit: planDef.messagesPerDay,
        plan: planDef.name,
        upgradeUrl: "/billing",
      }, { status: 402 });
    }
  }

  const pref = await db.userModelPreference.findUnique({
    where: { userId: session.user.id },
  });

  const modelDef = resolveModel({
    plan,
    mode: pref?.mode ?? "auto",
    provider: pref?.provider,
    modelId: pref?.modelId,
  });
  let system: string = SYSTEM_PROMPT;
  const dictionaryEntries = findDictionaryEntriesInText(message);
  if (conversation.agentId) {
    const agent = AGENTS.find((a) => a.id === conversation.agentId);
    if (agent) {
      system = buildAgentSystemPrompt(agent);
      const memory = await db.agentMemory.findUnique({
        where: { userId_agentId: { userId: session.user.id, agentId: agent.id } },
      });
      if (memory?.content) {
        system += `\n\nNotes the user has saved from previous sessions with you:\n${memory.content}`;
      }
    }
  }
  if (dictionaryEntries.length > 0) {
    system += `\n\nLegal dictionary context for explanation only (not legal authority):\n${formatDictionaryEntriesForPrompt(dictionaryEntries)}\nIf relevant, include a short "Sources Used" section in your answer using these source labels. Do not treat dictionary definitions as legal authority.`;
  }
  const dictionarySources = formatDictionarySources(dictionaryEntries);

  const { stream, onComplete } = routeMessage(
    modelDef,
    history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    system
  );

  let assistantContent = "";
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        assistantContent += text;
        controller.enqueue(encoder.encode(text));
      }
      if (dictionarySources) {
        const sourceBlock = `\n\n${dictionarySources}`;
        assistantContent += sourceBlock;
        controller.enqueue(encoder.encode(sourceBlock));
      }
      controller.close();
    },
  });

  after(async () => {
    const usage = await onComplete;
    await db.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: assistantContent,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    });
    await db.usageRecord.create({
      data: {
        userId: session.user.id,
        model: usage.model,
        provider: usage.provider,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costUsdMicro: usage.costUsdMicro,
      },
    });

    // 80% usage limit warning — fires exactly once when the threshold is crossed
    if (planDef.messagesPerDay) {
      try {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const totalCount = await db.usageRecord.count({
          where: { userId: session.user.id, createdAt: { gte: dayStart } },
        });
        const threshold = Math.round(planDef.messagesPerDay * 0.8);
        if (totalCount === threshold) {
          const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, name: true },
          });
          if (user) {
            await sendEmail(
              user.email,
              `You've used ${totalCount} of ${planDef.messagesPerDay} free chats today`,
              usageLimitWarningEmailHtml({
                name: user.name ?? "there",
                used: totalCount,
                limit: planDef.messagesPerDay,
                plan: planDef.name,
              })
            );
          }
        }
      } catch (err) {
        console.error("[chat] usage warning email failed:", err);
      }
    }
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Model": modelDef.modelId,
      "X-Provider": modelDef.provider,
    },
  });
}
