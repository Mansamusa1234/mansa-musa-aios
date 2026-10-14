// One-shot text completion for agent features: Anthropic when configured, otherwise Abacus RouteLLM.
import { anthropic } from "@/lib/anthropic";
import { isRouteLlmConfigured, routeLlmChat } from "@/lib/routellm";

export type TextMessage = { role: "user" | "assistant"; content: string };
export type TextResult = { text: string; provider: "anthropic" | "abacus"; model: string };

export function isTextAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) || isRouteLlmConfigured();
}

export async function completeText(input: { system: string; messages: TextMessage[]; maxTokens: number; anthropicModel: string }): Promise<TextResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await anthropic.messages.create({ model: input.anthropicModel, max_tokens: input.maxTokens, system: input.system, messages: input.messages });
    const block = response.content[0];
    return { text: block?.type === "text" ? block.text : "", provider: "anthropic", model: input.anthropicModel };
  }
  if (isRouteLlmConfigured()) {
    const result = await routeLlmChat({ messages: [{ role: "system", content: input.system }, ...input.messages], maxTokens: input.maxTokens });
    if (!result.ok || result.content === null) throw new Error(`RouteLLM request failed (status ${result.status})`);
    return { text: result.content, provider: "abacus", model: result.model ?? "route-llm" };
  }
  throw new Error("No AI provider is configured");
}
