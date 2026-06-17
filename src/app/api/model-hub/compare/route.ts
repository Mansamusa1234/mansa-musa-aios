import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/anthropic";
import { MODEL_CATALOG, routeMessage } from "@/lib/modelRouter";
import { NextResponse } from "next/server";
import { after } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, modelKeys } = await req.json() as { prompt: string; modelKeys: string[] };
  if (!prompt || !Array.isArray(modelKeys) || modelKeys.length < 2) {
    return NextResponse.json({ error: "Provide prompt and at least 2 model keys" }, { status: 400 });
  }

  const models = modelKeys
    .map((k) => MODEL_CATALOG.find((m) => `${m.provider}:${m.modelId}` === k))
    .filter(Boolean) as typeof MODEL_CATALOG;

  if (models.length < 2) return NextResponse.json({ error: "Unknown models" }, { status: 400 });

  const messages = [{ role: "user" as const, content: prompt }];

  const results = await Promise.all(
    models.map(async (model) => {
      if (!model.available()) {
        return { key: `${model.provider}:${model.modelId}`, text: "API key not configured", error: true };
      }
      try {
        const { stream, onComplete } = routeMessage(model, messages, SYSTEM_PROMPT);
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
        after(async () => {
          const usage = await onComplete;
          await db.usageRecord.create({
            data: { userId: session.user.id, model: model.modelId, provider: model.provider, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, costUsdMicro: usage.costUsdMicro },
          });
        });
        return { key: `${model.provider}:${model.modelId}`, displayName: model.displayName, provider: model.provider, text };
      } catch {
        return { key: `${model.provider}:${model.modelId}`, displayName: model.displayName, provider: model.provider, text: "Error calling model", error: true };
      }
    })
  );

  return NextResponse.json({ results });
}
