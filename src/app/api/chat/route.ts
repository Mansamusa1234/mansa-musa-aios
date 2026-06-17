import { auth } from "@/lib/auth";
import { SYSTEM_PROMPT, buildAgentSystemPrompt } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { PLANS } from "@/lib/stripe";
import { AGENTS } from "@/data/agents";
import { resolveModel, routeMessage } from "@/lib/modelRouter";
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

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });
  let plan = "free";
  if (subscription?.status === "ACTIVE" && subscription.stripePriceId) {
    const priceId = subscription.stripePriceId;
    if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) plan = "enterprise";
    else if (priceId === process.env.STRIPE_PRICE_PRO) plan = "pro";
    else if (priceId === process.env.STRIPE_PRICE_BASIC) plan = "basic";
  }

  const planDef = PLANS.find((p) => p.id === plan) ?? PLANS[0];
  if (planDef.messagesPerMonth !== Infinity) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const msgCount = await db.usageRecord.count({
      where: { userId: session.user.id, createdAt: { gte: monthStart } },
    });
    if (msgCount >= planDef.messagesPerMonth) {
      return NextResponse.json({
        error: "MESSAGE_LIMIT_REACHED",
        limit: planDef.messagesPerMonth,
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
    if (planDef.messagesPerMonth !== Infinity) {
      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const totalCount = await db.usageRecord.count({
          where: { userId: session.user.id, createdAt: { gte: monthStart } },
        });
        const threshold = Math.round(planDef.messagesPerMonth * 0.8);
        if (totalCount === threshold) {
          const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, name: true },
          });
          if (user) {
            await sendEmail(
              user.email,
              `You've used ${totalCount} of ${planDef.messagesPerMonth} messages this month`,
              usageLimitWarningEmailHtml({
                name: user.name ?? "there",
                used: totalCount,
                limit: planDef.messagesPerMonth,
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
