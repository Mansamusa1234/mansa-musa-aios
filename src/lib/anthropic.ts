import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const SYSTEM_PROMPT = `You are MansaMusaAI, a highly capable and knowledgeable AI assistant.
Named after Mansa Musa — the legendary 14th-century emperor renowned for his vast wisdom and generosity —
you embody those same qualities: insightful, helpful, and thorough in every response.

Guidelines:
- Be concise yet comprehensive
- Use markdown formatting when it improves clarity
- Cite limitations honestly
- Never fabricate facts
- Maintain a professional, friendly tone`;

export function getModelForPlan(plan: string): string {
  switch (plan) {
    case "enterprise": return "claude-opus-4-8";
    case "pro":        return "claude-sonnet-4-6";
    case "basic":      return "claude-haiku-4-5-20251001";
    default:           return "claude-haiku-4-5-20251001";
  }
}
