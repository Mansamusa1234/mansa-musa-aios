import { MODEL_CATALOG, routeMessage, type ModelDef } from "@/lib/modelRouter";
import type { OrchestratorLane } from "./types";

const PROVIDER_ORDER: Record<OrchestratorLane, string[]> = {
  research: ["gemini", "openai", "anthropic", "openrouter", "mistral", "grok"],
  analysis: ["anthropic", "openai", "gemini", "mistral", "openrouter", "grok"],
  engineering: ["anthropic", "openai", "gemini", "openrouter", "mistral", "grok"],
  creative: ["openai", "gemini", "anthropic", "mistral", "openrouter", "grok"],
  operations: ["anthropic", "openai", "gemini", "mistral", "openrouter", "grok"],
  risk: ["anthropic", "openai", "gemini", "mistral", "openrouter", "grok"],
  judge: ["anthropic", "openai", "gemini", "mistral", "openrouter", "grok"],
};

function candidates(lane: OrchestratorLane): ModelDef[] {
  const order = PROVIDER_ORDER[lane];
  return MODEL_CATALOG
    .filter((model) => {
      try {
        return model.available();
      } catch {
        return false;
      }
    })
    .sort((a, b) => order.indexOf(a.provider) - order.indexOf(b.provider));
}

async function consume(model: ModelDef, system: string, prompt: string) {
  const routed = routeMessage(model, [{ role: "user", content: prompt }], system);
  const reader = routed.stream.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    if (chunk.value) text += decoder.decode(chunk.value, { stream: true });
  }
  text += decoder.decode();
  if (!text.trim()) throw new Error(`${model.displayName} returned an empty response`);
  const usage = await routed.onComplete.catch(() => null);
  return { text: text.trim(), usage };
}

export function modelHubConfigured() {
  return candidates("analysis").length > 0;
}

export async function runLocalModelTask(args: {
  lane: OrchestratorLane;
  system: string;
  prompt: string;
}): Promise<{ text: string; model: string; provider: string } | null> {
  const list = candidates(args.lane);
  let lastError: unknown;

  for (const model of list.slice(0, 8)) {
    try {
      const result = await consume(model, args.system, args.prompt);
      return {
        text: result.text,
        model: model.modelId,
        provider: model.provider,
      };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
  return null;
}
