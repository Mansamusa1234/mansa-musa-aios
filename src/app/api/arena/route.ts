import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";

export const runtime = "nodejs";

type ProviderResult = {
  provider: string;
  model: string;
  family: "frontier" | "open";
  content: string;
  ok: boolean;
  error?: string;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function askOpenAI(prompt: string): Promise<ProviderResult> {
  const model = process.env.OPENAI_ARENA_MODEL || "gpt-5.1";
  try {
    const client = new OpenAI({ apiKey: required("OPENAI_API_KEY") });
    const response = await client.responses.create({ model, input: prompt });
    return { provider: "ChatGPT", model, family: "frontier", content: response.output_text || "[No response]", ok: true };
  } catch (error) {
    return { provider: "ChatGPT", model, family: "frontier", content: "", ok: false, error: error instanceof Error ? error.message : "OpenAI failed" };
  }
}

async function askGrok(prompt: string): Promise<ProviderResult> {
  const model = process.env.XAI_ARENA_MODEL || "grok-4";
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${required("XAI_API_KEY")}`,
      },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
    });
    if (!response.ok) throw new Error(`xAI request failed (${response.status}): ${await response.text()}`);
    const data = await response.json();
    return { provider: "Grok", model, family: "frontier", content: data.choices?.[0]?.message?.content || "[No response]", ok: true };
  } catch (error) {
    return { provider: "Grok", model, family: "frontier", content: "", ok: false, error: error instanceof Error ? error.message : "xAI failed" };
  }
}

async function askClaude(prompt: string): Promise<ProviderResult> {
  const model = process.env.ANTHROPIC_ARENA_MODEL || "claude-sonnet-4-6";
  try {
    const client = new Anthropic({ apiKey: required("ANTHROPIC_API_KEY") });
    const response = await client.messages.create({ model, max_tokens: 2500, messages: [{ role: "user", content: prompt }] });
    const text = response.content.find((item) => item.type === "text");
    return { provider: "Claude", model, family: "frontier", content: text?.type === "text" ? text.text : "[No response]", ok: true };
  } catch (error) {
    return { provider: "Claude", model, family: "frontier", content: "", ok: false, error: error instanceof Error ? error.message : "Anthropic failed" };
  }
}

async function askGemini(prompt: string): Promise<ProviderResult> {
  const model = process.env.GEMINI_ARENA_MODEL || "gemini-2.5-flash";
  try {
    const client = new GoogleGenerativeAI(required("GOOGLE_GENERATIVE_AI_API_KEY"));
    const genModel = client.getGenerativeModel({ model });
    const response = await genModel.generateContent(prompt);
    return { provider: "Gemini", model, family: "frontier", content: response.response.text() || "[No response]", ok: true };
  } catch (error) {
    return { provider: "Gemini", model, family: "frontier", content: "", ok: false, error: error instanceof Error ? error.message : "Gemini failed" };
  }
}

async function askMistral(prompt: string): Promise<ProviderResult> {
  const model = process.env.MISTRAL_ARENA_MODEL || "mistral-large-latest";
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${required("MISTRAL_API_KEY")}`,
      },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
    });
    if (!response.ok) throw new Error(`Mistral request failed (${response.status}): ${await response.text()}`);
    const data = await response.json();
    return { provider: "Mistral", model, family: "open", content: data.choices?.[0]?.message?.content || "[No response]", ok: true };
  } catch (error) {
    return { provider: "Mistral", model, family: "open", content: "", ok: false, error: error instanceof Error ? error.message : "Mistral failed" };
  }
}

async function askOpenRouterModel(prompt: string, model: string, index: number): Promise<ProviderResult> {
  const provider = `Open Model ${index + 1}`;
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${required("OPENROUTER_API_KEY")}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://mansamusaai.com",
        "X-Title": "Mansa Musa AI Clash Arena",
      },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
    });
    if (!response.ok) throw new Error(`OpenRouter request failed (${response.status}): ${await response.text()}`);
    const data = await response.json();
    return { provider, model, family: "open", content: data.choices?.[0]?.message?.content || "[No response]", ok: true };
  } catch (error) {
    return { provider, model, family: "open", content: "", ok: false, error: error instanceof Error ? error.message : "Open model failed" };
  }
}

async function judge(prompt: string, answers: ProviderResult[]) {
  const successful = answers.filter((answer) => answer.ok);
  if (successful.length < 2) return null;

  const model = process.env.OPENAI_JUDGE_MODEL || process.env.OPENAI_ARENA_MODEL || "gpt-5.1";
  const candidates = successful
    .map((answer, index) => `Candidate ${index + 1} — ${answer.provider} (${answer.model}, ${answer.family}):\n${answer.content}`)
    .join("\n\n---\n\n");
  const allowed = successful.map((a) => a.provider).join("|");
  const scoreShape = successful.map((a) => `"${a.provider}":0-100`).join(",");

  const rubric = `You are the neutral judge in the Mansa Musa AI Clash Arena.
Closed/frontier and open-model systems are competing on equal terms.
Evaluate each answer using factual accuracy, completeness, reasoning quality, usefulness, implementation quality, security/safety, and clarity.
Do not favor a provider because of its brand, model family, size, or licensing. Judge only the answer.
Produce a merged answer that improves on every candidate and does not repeat known errors.

User task:\n${prompt}\n\n${candidates}\n\nReturn valid JSON only in this exact shape:
{"winner":"${allowed}|Tie","scores":{${scoreShape}},"reason":"short explanation","bestAnswer":"superior merged answer"}`;

  const client = new OpenAI({ apiKey: required("OPENAI_API_KEY") });
  const response = await client.responses.create({ model, input: rubric });
  const text = response.output_text || "{}";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { winner: "Tie", scores: {}, reason: "Judge output could not be parsed.", bestAnswer: text };
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.arena, session.user.id);
  if (limited) return limited;

  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    if (prompt.length > 10000) return NextResponse.json({ error: "Prompt is too long" }, { status: 400 });

    const openRouterModels = (process.env.OPENROUTER_ARENA_MODELS || "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean)
      .slice(0, 6);

    const contestants: Promise<ProviderResult>[] = [
      askOpenAI(prompt),
      askGrok(prompt),
      askClaude(prompt),
      askGemini(prompt),
      askMistral(prompt),
      ...openRouterModels.map((model, index) => askOpenRouterModel(prompt, model, index)),
    ];

    const answers = await Promise.all(contestants);
    const verdict = await judge(prompt, answers);
    return NextResponse.json({
      prompt,
      answers,
      verdict,
      contestantCount: answers.length,
      successfulCount: answers.filter((answer) => answer.ok).length,
    });
  } catch (error) {
    console.error("Arena error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arena request failed" },
      { status: 500 },
    );
  }
}
