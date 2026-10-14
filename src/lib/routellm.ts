// Abacus RouteLLM (OpenAI-compatible chat completions). Server-side only; the key never leaves the server.
const DEFAULT_URL = "https://routellm.abacus.ai/v1/chat/completions";

export function isRouteLlmConfigured(): boolean {
  return Boolean(process.env.ABACUS_API_KEY?.trim());
}

export type RouteLlmResult = {
  ok: boolean;
  status: number;
  ms: number;
  model: string | null;
  content: string | null;
  // RouteLLM reports input_tokens/output_tokens (verified on Preview); OpenAI-style names kept for other routes.
  usage: { input_tokens?: number; output_tokens?: number; reasoning_tokens?: number; prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  error: string | null;
};

export async function routeLlmChat(input: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens: number;
  model?: string;
  timeoutMs?: number;
}): Promise<RouteLlmResult> {
  const key = process.env.ABACUS_API_KEY?.trim();
  const started = Date.now();
  if (!key) return { ok: false, status: 0, ms: 0, model: null, content: null, usage: null, error: "ABACUS_API_KEY is not set" };
  try {
    const res = await fetch(process.env.ABACUS_ROUTELLM_URL || DEFAULT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: input.model ?? process.env.ABACUS_ROUTELLM_MODEL ?? "route-llm", max_tokens: input.maxTokens, messages: input.messages }),
      signal: AbortSignal.timeout(input.timeoutMs ?? 60000),
    });
    const body = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      model: typeof body?.model === "string" ? body.model : null,
      content: typeof body?.choices?.[0]?.message?.content === "string" ? body.choices[0].message.content : null,
      usage: body?.usage ?? null,
      // Provider error bodies are truncated and scrubbed of the key before they go anywhere.
      error: res.ok ? null : JSON.stringify(body).split(key).join("[redacted]").slice(0, 300),
    };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - started, model: null, content: null, usage: null, error: err instanceof Error ? err.message : String(err) };
  }
}
