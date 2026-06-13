import { auth } from "@/lib/auth";
import { anthropic, SYSTEM_PROMPT, getModelForPlan } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

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

  // Verify ownership
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Save user message
  await db.message.create({
    data: { conversationId, role: "user", content: message },
  });

  // Update conversation title from first message
  if (conversation.title === "New Conversation") {
    await db.conversation.update({
      where: { id: conversationId },
      data: { title: message.slice(0, 60) },
    });
  }

  // Get history
  const history = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Get plan from subscription price ID
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
  const model = getModelForPlan(plan);

  // Stream response
  const stream = await anthropic.messages.stream({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  let assistantContent = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          assistantContent += chunk.delta.text;
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();

      // Persist assistant message after streaming
      const finalMsg = await stream.finalMessage();
      await db.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: assistantContent,
          inputTokens: finalMsg.usage.input_tokens,
          outputTokens: finalMsg.usage.output_tokens,
        },
      });

      await db.usageRecord.create({
        data: {
          userId: session.user.id,
          model,
          inputTokens: finalMsg.usage.input_tokens,
          outputTokens: finalMsg.usage.output_tokens,
        },
      });
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
