import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";

export type ModelProvider = "anthropic" | "openai" | "grok" | "gemini" | "mistral";
export type RoutingMode = "auto" | "manual";

export interface ModelDef {
  provider: ModelProvider;
  modelId: string;
  displayName: string;
  description: string;
  planGate: "free" | "basic" | "pro" | "enterprise";
  contextWindow: number;
  costPer1kInMicro: number;
  costPer1kOutMicro: number;
  badge?: string;
  available: () => boolean;
}

export const MODEL_CATALOG: ModelDef[] = [
  // ── Anthropic ─────────────────────────────────────────
  {
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
    displayName: "Claude Haiku 4.5",
    description: "Fast, lightweight — ideal for everyday tasks",
    planGate: "free",
    contextWindow: 200000,
    costPer1kInMicro: 800,
    costPer1kOutMicro: 4000,
    available: () => !!process.env.ANTHROPIC_API_KEY,
  },
  {
    provider: "anthropic",
    modelId: "claude-sonnet-4-6",
    displayName: "Claude Sonnet 4.6",
    description: "Balanced intelligence for professional use",
    planGate: "pro",
    contextWindow: 200000,
    costPer1kInMicro: 3000,
    costPer1kOutMicro: 15000,
    badge: "Pro",
    available: () => !!process.env.ANTHROPIC_API_KEY,
  },
  {
    provider: "anthropic",
    modelId: "claude-opus-4-8",
    displayName: "Claude Opus 4.8",
    description: "Most powerful Claude — complex reasoning",
    planGate: "enterprise",
    contextWindow: 200000,
    costPer1kInMicro: 15000,
    costPer1kOutMicro: 75000,
    badge: "Enterprise",
    available: () => !!process.env.ANTHROPIC_API_KEY,
  },
  // ── OpenAI ────────────────────────────────────────────
  {
    provider: "openai",
    modelId: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    description: "OpenAI's fast and affordable model",
    planGate: "basic",
    contextWindow: 128000,
    costPer1kInMicro: 150,
    costPer1kOutMicro: 600,
    available: () => !!process.env.OPENAI_API_KEY,
  },
  {
    provider: "openai",
    modelId: "gpt-4o",
    displayName: "GPT-4o",
    description: "OpenAI's flagship multimodal model",
    planGate: "pro",
    contextWindow: 128000,
    costPer1kInMicro: 2500,
    costPer1kOutMicro: 10000,
    badge: "Pro",
    available: () => !!process.env.OPENAI_API_KEY,
  },
  // ── xAI Grok ─────────────────────────────────────────
  {
    provider: "grok",
    modelId: "grok-3-mini",
    displayName: "Grok 3 Mini",
    description: "xAI's fast reasoning model",
    planGate: "basic",
    contextWindow: 131072,
    costPer1kInMicro: 300,
    costPer1kOutMicro: 500,
    available: () => !!process.env.XAI_API_KEY,
  },
  {
    provider: "grok",
    modelId: "grok-3",
    displayName: "Grok 3",
    description: "xAI's flagship model with real-time knowledge",
    planGate: "pro",
    contextWindow: 131072,
    costPer1kInMicro: 3000,
    costPer1kOutMicro: 15000,
    badge: "Pro",
    available: () => !!process.env.XAI_API_KEY,
  },
  // ── Google Gemini ─────────────────────────────────────
  {
    provider: "gemini",
    modelId: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    description: "Google's fast, multimodal model",
    planGate: "basic",
    contextWindow: 1048576,
    costPer1kInMicro: 100,
    costPer1kOutMicro: 400,
    available: () => !!process.env.GOOGLE_AI_API_KEY,
  },
  {
    provider: "gemini",
    modelId: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    description: "Google's most capable model",
    planGate: "pro",
    contextWindow: 2097152,
    badge: "Pro",
    costPer1kInMicro: 1250,
    costPer1kOutMicro: 10000,
    available: () => !!process.env.GOOGLE_AI_API_KEY,
  },
  // ── Mistral ───────────────────────────────────────────
  {
    provider: "mistral",
    modelId: "mistral-small-latest",
    displayName: "Mistral Small",
    description: "Fast, efficient European AI",
    planGate: "basic",
    contextWindow: 128000,
    costPer1kInMicro: 100,
    costPer1kOutMicro: 300,
    available: () => !!process.env.MISTRAL_API_KEY,
  },
  {
    provider: "mistral",
    modelId: "mistral-large-latest",
    displayName: "Mistral Large",
    description: "Mistral's top-tier reasoning model",
    planGate: "pro",
    contextWindow: 128000,
    costPer1kInMicro: 2000,
    costPer1kOutMicro: 6000,
    badge: "Pro",
    available: () => !!process.env.MISTRAL_API_KEY,
  },
];

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface RouteResult {
  stream: ReadableStream<Uint8Array>;
  onComplete: Promise<{ inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }>;
}

const PLAN_ORDER = ["free", "basic", "pro", "enterprise"];
const planRank = (p: string) => PLAN_ORDER.indexOf(p);

export function getAutoModel(plan: string): ModelDef {
  const candidates: Record<string, string> = {
    enterprise: "claude-opus-4-8",
    pro:        "claude-sonnet-4-6",
    basic:      "claude-haiku-4-5-20251001",
    free:       "claude-haiku-4-5-20251001",
  };
  const target = candidates[plan] ?? candidates.free;
  return MODEL_CATALOG.find((m) => m.modelId === target)!;
}

export function resolveModel(opts: {
  plan: string;
  mode: string;
  provider?: string;
  modelId?: string;
}): ModelDef {
  if (opts.mode === "manual" && opts.provider && opts.modelId) {
    const found = MODEL_CATALOG.find(
      (m) => m.provider === opts.provider && m.modelId === opts.modelId
    );
    if (found && planRank(opts.plan) >= planRank(found.planGate) && found.available()) {
      return found;
    }
  }
  return getAutoModel(opts.plan);
}

export function routeMessage(
  model: ModelDef,
  messages: ChatMessage[],
  system: string
): RouteResult {
  switch (model.provider) {
    case "anthropic": return routeAnthropic(model, messages, system);
    case "openai":    return routeOpenAI(model, messages, system);
    case "grok":      return routeGrok(model, messages, system);
    case "gemini":    return routeGemini(model, messages, system);
    case "mistral":   return routeMistral(model, messages, system);
  }
}

/* ── Anthropic ──────────────────────────────────────────────── */
function routeAnthropic(model: ModelDef, messages: ChatMessage[], system: string): RouteResult {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const encoder = new TextEncoder();
  let resolveFn: (v: { inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }) => void;
  const onComplete = new Promise<{ inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }>(
    (r) => { resolveFn = r; }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const s = await client.messages.stream({ model: model.modelId, max_tokens: 2048, system, messages });
      for await (const chunk of s) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
      const final = await s.finalMessage();
      const inp = final.usage.input_tokens;
      const out = final.usage.output_tokens;
      resolveFn!({ inputTokens: inp, outputTokens: out, costUsdMicro: Math.round(inp * model.costPer1kInMicro / 1000 + out * model.costPer1kOutMicro / 1000), model: model.modelId, provider: "anthropic" });
    },
  });

  return { stream, onComplete };
}

/* ── OpenAI ─────────────────────────────────────────────────── */
function routeOpenAI(model: ModelDef, messages: ChatMessage[], system: string): RouteResult {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const encoder = new TextEncoder();
  let resolveFn: (v: { inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }) => void;
  const onComplete = new Promise<{ inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }>(
    (r) => { resolveFn = r; }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let inputTokens = 0, outputTokens = 0;
      const s = await client.chat.completions.create({
        model: model.modelId, stream: true, stream_options: { include_usage: true },
        max_tokens: 2048,
        messages: [{ role: "system", content: system }, ...messages],
      });
      for await (const chunk of s) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
        if (chunk.usage) { inputTokens = chunk.usage.prompt_tokens; outputTokens = chunk.usage.completion_tokens; }
      }
      controller.close();
      resolveFn!({ inputTokens, outputTokens, costUsdMicro: Math.round(inputTokens * model.costPer1kInMicro / 1000 + outputTokens * model.costPer1kOutMicro / 1000), model: model.modelId, provider: "openai" });
    },
  });

  return { stream, onComplete };
}

/* ── xAI Grok (OpenAI-compatible) ──────────────────────────── */
function routeGrok(model: ModelDef, messages: ChatMessage[], system: string): RouteResult {
  const client = new OpenAI({ apiKey: process.env.XAI_API_KEY!, baseURL: "https://api.x.ai/v1" });
  const encoder = new TextEncoder();
  let resolveFn: (v: { inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }) => void;
  const onComplete = new Promise<{ inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }>(
    (r) => { resolveFn = r; }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let inputTokens = 0, outputTokens = 0;
      const s = await client.chat.completions.create({
        model: model.modelId, stream: true,
        max_tokens: 2048,
        messages: [{ role: "system", content: system }, ...messages],
      });
      for await (const chunk of s) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
        if (chunk.usage) { inputTokens = chunk.usage.prompt_tokens; outputTokens = chunk.usage.completion_tokens; }
      }
      controller.close();
      resolveFn!({ inputTokens, outputTokens, costUsdMicro: Math.round(inputTokens * model.costPer1kInMicro / 1000 + outputTokens * model.costPer1kOutMicro / 1000), model: model.modelId, provider: "grok" });
    },
  });

  return { stream, onComplete };
}

/* ── Google Gemini ──────────────────────────────────────────── */
function routeGemini(model: ModelDef, messages: ChatMessage[], system: string): RouteResult {
  const encoder = new TextEncoder();
  let resolveFn: (v: { inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }) => void;
  const onComplete = new Promise<{ inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }>(
    (r) => { resolveFn = r; }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
        const gemini = genAI.getGenerativeModel({ model: model.modelId, systemInstruction: system });
        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const last = messages[messages.length - 1];
        const chat = gemini.startChat({ history });
        const result = await chat.sendMessageStream(last?.content ?? "");
        let inputTokens = 0, outputTokens = 0;
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        const final = await result.response;
        inputTokens = final.usageMetadata?.promptTokenCount ?? 0;
        outputTokens = final.usageMetadata?.candidatesTokenCount ?? 0;
        controller.close();
        resolveFn!({ inputTokens, outputTokens, costUsdMicro: Math.round(inputTokens * model.costPer1kInMicro / 1000 + outputTokens * model.costPer1kOutMicro / 1000), model: model.modelId, provider: "gemini" });
      } catch (err) {
        controller.close();
        resolveFn!({ inputTokens: 0, outputTokens: 0, costUsdMicro: 0, model: model.modelId, provider: "gemini" });
        throw err;
      }
    },
  });

  return { stream, onComplete };
}

/* ── Mistral ─────────────────────────────────────────────────── */
function routeMistral(model: ModelDef, messages: ChatMessage[], system: string): RouteResult {
  const encoder = new TextEncoder();
  let resolveFn: (v: { inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }) => void;
  const onComplete = new Promise<{ inputTokens: number; outputTokens: number; costUsdMicro: number; model: string; provider: string }>(
    (r) => { resolveFn = r; }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
        let inputTokens = 0, outputTokens = 0;
        const s = await client.chat.stream({
          model: model.modelId,
          messages: [{ role: "system", content: system }, ...messages],
        });
        for await (const event of s) {
          const text = event.data.choices[0]?.delta?.content ?? "";
          if (typeof text === "string" && text) controller.enqueue(encoder.encode(text));
          if (event.data.usage) {
            inputTokens = event.data.usage.promptTokens ?? 0;
            outputTokens = event.data.usage.completionTokens ?? 0;
          }
        }
        controller.close();
        resolveFn!({ inputTokens, outputTokens, costUsdMicro: Math.round(inputTokens * model.costPer1kInMicro / 1000 + outputTokens * model.costPer1kOutMicro / 1000), model: model.modelId, provider: "mistral" });
      } catch (err) {
        controller.close();
        resolveFn!({ inputTokens: 0, outputTokens: 0, costUsdMicro: 0, model: model.modelId, provider: "mistral" });
        throw err;
      }
    },
  });

  return { stream, onComplete };
}
