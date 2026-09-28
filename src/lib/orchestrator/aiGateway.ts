import type { OrchestratorLane } from "./types";

const MODEL_ENV: Record<OrchestratorLane, string> = {
  research: "AI_GATEWAY_MODEL_RESEARCH",
  analysis: "AI_GATEWAY_MODEL_REASONING",
  engineering: "AI_GATEWAY_MODEL_REASONING",
  creative: "AI_GATEWAY_MODEL_CREATIVE",
  operations: "AI_GATEWAY_MODEL_FAST",
  risk: "AI_GATEWAY_MODEL_REASONING",
  judge: "AI_GATEWAY_MODEL_JUDGE",
};

export function aiGatewayConfigured() {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

function modelForLane(lane: OrchestratorLane) {
  const specific = process.env[MODEL_ENV[lane]];
  return specific || process.env.AI_GATEWAY_MODEL_DEFAULT || "";
}

export async function runAiGatewayTask(args: {
  lane: OrchestratorLane;
  system: string;
  prompt: string;
}): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const model = modelForLane(args.lane);
  if (!apiKey || !model) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 75_000);

  try {
    const response = await fetch(
      process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: args.lane === "creative" ? 0.7 : 0.2,
          max_tokens: args.lane === "judge" ? 3500 : 2400,
          messages: [
            { role: "system", content: args.system },
            { role: "user", content: args.prompt },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`AI Gateway failed with HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("AI Gateway returned an empty response");
    return { text, model };
  } finally {
    clearTimeout(timeout);
  }
}
