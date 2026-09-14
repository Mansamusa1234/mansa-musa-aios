import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";

export const runtime = "nodejs";

type ProviderName = "ChatGPT" | "Grok" | "Claude" | "Gemini";
type ProviderResult = { provider: ProviderName; model: string; content: string; ok: boolean; error?: string };

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
    return { provider: "ChatGPT", model, content: response.output_text || "[No response]", ok: true };
  } catch (error) {
    return { provider: "ChatGPT", model, content: "", ok: false, error: error instanceof Error ? error.message : "OpenAI failed" };
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
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });
    if (!response.ok) throw new Error(`xAI request failed (${response.status}): ${await response.text()}`);
    const data = await response.json();
    return { provider: "Grok", model, content: data.choices?.[0]?.message?.content || "[No response]", ok: true };
  } catch (error) {
    return { provider: "Grok", model, content: "", ok: false, error: error instanceof Error ? error.message : "xAI failed" };
  }
}

async function askClaude(prompt: string): Promise<ProviderResult> {
  const model = process.env.ANTHROPIC_ARENA_MODEL || "claude-sonnet-4-6";
  try {
    const client = new Anthropic({ apiKey: required("ANTHROPIC_API_KEY") });
    const response = await client.messages.create({
      model,
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content.find((item) => item.type === "text");
    return { provider: "Claude", model, content: text?.type === "text" ? text.text : "[No response]", ok: true };
  } catch (error) {
    return { provider: "Claude", model, content: "", ok: false, error: error instanceof Error ? error.message : "Anthropic failed" };
  }
}

async function askGemini(prompt: string): Promise<ProviderResult> {
  const model = process.env.GEMINI_ARENA_MODEL || "gemini-2.5-flash";
  try {
    const client = new GoogleGenerativeAI(required("GOOGLE_GENERATIVE_AI_API_KEY"));
    const genModel = client.getGenerativeModel({ model });
    const response = await genModel.generateContent(prompt);
    return { provider: "Gemini", model, content: response.response.text() || "[No response]", ok: true };
  } catch (error) {
    return { provider: "Gemini", model, content: "", ok: false, error: error instanceof Error ? error.message : "Gemini failed" };
  }
}

async function judge(prompt: string, answers: ProviderResult[]) {
  const successful = answers.filter((answer) => answer.ok);
  if (successful.length < 2) return null;

  const model = process.env.OPENAI_JUDGE_MODEL || process.env.OPENAI_ARENA_MODEL || "gpt-5.1";
  const candidates = successful
    .map((answer, index) => `Candidate ${index + 1} — ${answer.provider} (${answer.model}):\n${answer.content}`)
    .join("\n\n---\n\n");
  const allowed = successful.map((a) => a.provider).join("|");
  const scoreShape = successful.map((a) => `"${a.provider}":0-100`).join(",");

  const rubric = `You are the neutral judge in a multi-model AI council.
Evaluate the candidate answers to the user's task using factual accuracy, completeness, reasoning quality, usefulness, implementation quality, security/safety, and clarity.
Do not reward style over correctness. Produce a merged answer that improves on every candidate and does not repeat known errors.

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

    const answers = await Promise.all([
      askOpenAI(prompt),
      askGrok(prompt),
      askClaude(prompt),
      askGemini(prompt),
    ]);

    const verdict = await judge(prompt, answers);
    return NextResponse.json({ prompt, answers, verdict });
  } catch (error) {
    console.error("Arena error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arena request failed" },
      { status: 500 },
    );
  }
}
