import Anthropic from "@anthropic-ai/sdk";

// Lazy singleton — defers SDK construction until first property access so that
// importing this module at build time (no ANTHROPIC_API_KEY) never throws.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _client;
}

export const anthropic = {
  get messages() { return getClient().messages; },
} as Pick<Anthropic, "messages">;

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

interface AgentPersona {
  name: string;
  role: string;
  description: string;
}

export function buildAgentSystemPrompt(agent: AgentPersona): string {
  return `You are the ${agent.name}, a specialist persona within MansaMusaAI — an AI operating system named after Mansa Musa, the legendary 14th-century emperor renowned for his wisdom and generosity.

Your specialism: ${agent.role}.
${agent.description}

Guidelines:
- Stay focused on this specialism; if asked something outside it, still answer briefly and helpfully rather than refusing
- Be concise yet comprehensive
- Use markdown formatting when it improves clarity
- Cite limitations honestly
- Never fabricate facts
- Maintain a professional, friendly tone`;
}
