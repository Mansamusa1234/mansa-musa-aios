import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SYSTEM_PROMPT } from "@/lib/anthropic";
import { MODEL_CATALOG, routeMessage } from "@/lib/modelRouter";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { recordHospitalFailure } from "@/lib/hospital";
import { z } from "zod";

const compareSchema = z.object({
  prompt: z.string().trim().min(8).max(2000),
  modelKeys: z.array(z.string()).min(2).max(4).refine((keys) => new Set(keys).size === keys.length),
});

interface JudgedScore {
  key: string;
  score: number;
  rationale: string;
}

async function judgeResults(
  prompt: string,
  results: { key: string; displayName?: string; text: string; error?: boolean }[],
): Promise<{ scores: JudgedScore[]; winnerKey: string | null }> {
  const candidates = results.filter((result) => !result.error && result.text.trim());
  if (candidates.length < 2 || !process.env.ANTHROPIC_API_KEY) return { scores: [], winnerKey: null };

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: "Judge AI answers impartially. Reward factual accuracy, usefulness, clarity, and honest uncertainty. Never reward a model for claiming an identity or attacking another model.",
      messages: [{
        role: "user",
        content: `Original prompt:\n${prompt}\n\nCandidate answers:\n${candidates.map((item) => `--- ${item.key} (${item.displayName}) ---\n${item.text.slice(0, 4000)}`).join("\n\n")}`,
      }],
      tools: [{
        name: "submit_verdict",
        description: "Submit a score and short rationale for every candidate.",
        input_schema: {
          type: "object",
          properties: {
            scores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string", enum: candidates.map((item) => item.key) },
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  rationale: { type: "string" },
                },
                required: ["key", "score", "rationale"],
              },
            },
          },
          required: ["scores"],
        },
      }],
      tool_choice: { type: "tool", name: "submit_verdict" },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (toolUse?.type !== "tool_use") return { scores: [], winnerKey: null };
    const input = toolUse.input as { scores?: JudgedScore[] };
    const validKeys = new Set(candidates.map((item) => item.key));
    const scores = (input.scores ?? [])
      .filter((score) => validKeys.has(score.key))
      .map((score) => ({
        key: score.key,
        score: Math.max(0, Math.min(100, Math.round(Number(score.score) || 0))),
        rationale: String(score.rationale ?? "").slice(0, 300),
      }))
      .sort((a, b) => b.score - a.score);
    return { scores, winnerKey: scores[0]?.key ?? null };
  } catch (error) {
    await recordHospitalFailure({
      source: "model-competition",
      operation: "judge-results",
      error,
      severity: "warning",
      retriable: false,
    });
    return { scores: [], winnerKey: null };
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.arena, session.user.id);
  if (limited) return limited;

  const parsed = compareSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Provide a prompt and 2–4 unique models." }, { status: 400 });
  const { prompt, modelKeys } = parsed.data;

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
      } catch (error) {
        await recordHospitalFailure({
          source: "model-competition",
          operation: `compare:${model.provider}:${model.modelId}`,
          error,
          severity: "warning",
          retriable: false,
        });
        return { key: `${model.provider}:${model.modelId}`, displayName: model.displayName, provider: model.provider, text: "Error calling model", error: true };
      }
    })
  );

  const verdict = await judgeResults(prompt, results);
  const scoreMap = new Map(verdict.scores.map((score) => [score.key, score]));

  return NextResponse.json({
    results: results.map((result) => ({ ...result, ...scoreMap.get(result.key) })),
    winnerKey: verdict.winnerKey,
  });
}
