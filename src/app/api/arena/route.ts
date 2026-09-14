import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askOpenAI(prompt: string) {
  const model = process.env.OPENAI_ARENA_MODEL || "gpt-5.1";
  const response = await openai.responses.create({
    model,
    input: prompt,
  });
  return response.output_text || "";
}

async function askGrok(prompt: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY is not configured");

  const model = process.env.XAI_ARENA_MODEL || "grok-4";
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`xAI request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function judge(prompt: string, chatgpt: string, grok: string) {
  const judgeModel = process.env.OPENAI_JUDGE_MODEL || process.env.OPENAI_ARENA_MODEL || "gpt-5.1";
  const rubric = `You are the neutral judge in an AI model arena. Evaluate two candidate answers to the user's task.

User task:\n${prompt}

Candidate A — ChatGPT:\n${chatgpt}

Candidate B — Grok:\n${grok}

Judge using: factual accuracy, completeness, reasoning quality, usefulness, implementation quality, security/safety, and clarity.
Return valid JSON only in this shape:
{"winner":"ChatGPT|Grok|Tie","chatgptScore":0-100,"grokScore":0-100,"reason":"short explanation","bestAnswer":"a superior merged answer that keeps the strongest parts of both and fixes weaknesses"}`;

  const response = await openai.responses.create({ model: judgeModel, input: rubric });
  const text = response.output_text || "{}";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      winner: "Tie",
      chatgptScore: 0,
      grokScore: 0,
      reason: "Judge response could not be parsed as JSON.",
      bestAnswer: text,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (prompt.length > 20000) {
      return NextResponse.json({ error: "Prompt is too long" }, { status: 400 });
    }

    const [chatgptResult, grokResult] = await Promise.allSettled([
      askOpenAI(prompt),
      askGrok(prompt),
    ]);

    const chatgpt = chatgptResult.status === "fulfilled" ? chatgptResult.value : `ERROR: ${chatgptResult.reason?.message || "ChatGPT failed"}`;
    const grok = grokResult.status === "fulfilled" ? grokResult.value : `ERROR: ${grokResult.reason?.message || "Grok failed"}`;

    let verdict = null;
    if (chatgptResult.status === "fulfilled" && grokResult.status === "fulfilled") {
      verdict = await judge(prompt, chatgpt, grok);
    }

    return NextResponse.json({
      prompt,
      chatgpt,
      grok,
      verdict,
      models: {
        chatgpt: process.env.OPENAI_ARENA_MODEL || "gpt-5.1",
        grok: process.env.XAI_ARENA_MODEL || "grok-4",
        judge: process.env.OPENAI_JUDGE_MODEL || process.env.OPENAI_ARENA_MODEL || "gpt-5.1",
      },
    });
  } catch (error) {
    console.error("Arena error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arena request failed" },
      { status: 500 },
    );
  }
}
