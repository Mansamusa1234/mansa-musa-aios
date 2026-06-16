import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { DEBATER_KEYS, ensureArenaAgentsSeeded } from "@/lib/arenaAgents";

const DEBATER_MODEL = "claude-haiku-4-5-20251001";
const JUDGE_MODEL = "claude-sonnet-4-6";
const SYNTHESIS_MODEL = "claude-opus-4-8";

interface ScoreResult {
  agentKey: string;
  truth: number;
  evidence: number;
  depth: number;
  practicality: number;
  riskAwareness: number;
  originality: number;
  clarity: number;
  longTermValue: number;
  rationale: string;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(10, Math.round(Number(n) || 0)));
}

async function callAgent(systemPrompt: string, userContent: string, model: string, maxTokens: number): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });
    if (msg.stop_reason === "max_tokens") {
      console.warn(`[arena] response truncated at max_tokens=${maxTokens} for model ${model}`);
    }
    const block = msg.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text : "[No response generated]";
  } catch (err) {
    console.error("[arena] agent call failed:", err);
    return "[This agent's response could not be generated due to an error.]";
  }
}

async function scoreAnswers(
  judgeSystemPrompt: string,
  question: string,
  answersBlock: string,
  validKeys: string[]
): Promise<ScoreResult[]> {
  try {
    const msg = await anthropic.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 2000,
      system: judgeSystemPrompt,
      messages: [{ role: "user", content: `Question: ${question}\n\nAgent answers to score:\n\n${answersBlock}` }],
      tools: [
        {
          name: "submit_scores",
          description: "Submit wisdom scores for every agent's answer",
          input_schema: {
            type: "object",
            properties: {
              scores: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    agentKey: { type: "string", enum: validKeys },
                    truth: { type: "integer", minimum: 0, maximum: 10 },
                    evidence: { type: "integer", minimum: 0, maximum: 10 },
                    depth: { type: "integer", minimum: 0, maximum: 10 },
                    practicality: { type: "integer", minimum: 0, maximum: 10 },
                    riskAwareness: { type: "integer", minimum: 0, maximum: 10 },
                    originality: { type: "integer", minimum: 0, maximum: 10 },
                    clarity: { type: "integer", minimum: 0, maximum: 10 },
                    longTermValue: { type: "integer", minimum: 0, maximum: 10 },
                    rationale: { type: "string" },
                  },
                  required: ["agentKey", "truth", "evidence", "depth", "practicality", "riskAwareness", "originality", "clarity", "longTermValue", "rationale"],
                },
              },
            },
            required: ["scores"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_scores" },
    });

    const toolUse = msg.content.find((b) => b.type === "tool_use");
    if (toolUse && toolUse.type === "tool_use") {
      const input = toolUse.input as { scores: ScoreResult[] };
      const byKey = new Map(input.scores.map((s) => [s.agentKey, s]));
      if (validKeys.every((k) => byKey.has(k))) {
        return validKeys.map((k) => {
          const s = byKey.get(k)!;
          return {
            agentKey: k,
            truth: clamp(s.truth), evidence: clamp(s.evidence), depth: clamp(s.depth),
            practicality: clamp(s.practicality), riskAwareness: clamp(s.riskAwareness),
            originality: clamp(s.originality), clarity: clamp(s.clarity), longTermValue: clamp(s.longTermValue),
            rationale: s.rationale || "",
          };
        });
      }
    }
  } catch (err) {
    console.error("[arena] judge scoring failed:", err);
  }

  return validKeys.map((agentKey) => ({
    agentKey, truth: 5, evidence: 5, depth: 5, practicality: 5, riskAwareness: 5, originality: 5, clarity: 5, longTermValue: 5,
    rationale: "Fallback score — the judge's structured scoring response could not be parsed.",
  }));
}

export async function runArenaPipeline(sessionId: string, question: string): Promise<void> {
  await ensureArenaAgentsSeeded();

  const debaters = await db.agent.findMany({ where: { key: { in: DEBATER_KEYS } } });
  const judgeAgent = await db.agent.findUnique({ where: { key: "wisdom-judge" } });
  const synthesisAgent = await db.agent.findUnique({ where: { key: "synthesis" } });

  if (!judgeAgent || !synthesisAgent || debaters.length !== DEBATER_KEYS.length) {
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "FAILED", error: "Arena agents are not seeded correctly" } });
    return;
  }

  try {
    // Round 1 — initial answers, all debaters in parallel
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "DEBATING" } });
    const initial = await Promise.all(
      debaters.map(async (agent) => {
        const content = await callAgent(
          agent.systemPrompt,
          `Question: ${question}\n\nGive your answer in 4-8 sentences.`,
          DEBATER_MODEL,
          700
        );
        await db.agentResponse.create({ data: { sessionId, agentId: agent.id, round: "INITIAL", content } });
        return { agent, content };
      })
    );

    // Round 2 — each debater critiques everyone else's initial answer
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "CRITIQUING" } });
    const critiques = await Promise.all(
      initial.map(async ({ agent }) => {
        const othersBlock = initial
          .filter((r) => r.agent.key !== agent.key)
          .map((r) => `${r.agent.name}: ${r.content}`)
          .join("\n\n");
        const content = await callAgent(
          agent.systemPrompt,
          `Question: ${question}\n\nHere are the other agents' initial answers:\n\n${othersBlock}\n\nCritique these answers from your perspective — what's missing, wrong, or weak? Be specific, in 3-5 sentences.`,
          DEBATER_MODEL,
          500
        );
        await db.agentResponse.create({ data: { sessionId, agentId: agent.id, round: "CRITIQUE", content } });
        return { agent, content };
      })
    );

    // Round 3 — each debater improves their own answer in light of the critiques
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "IMPROVING" } });
    const critiquesBlock = critiques.map((c) => `${c.agent.name}: ${c.content}`).join("\n\n");
    const improved = await Promise.all(
      initial.map(async ({ agent, content: ownInitial }) => {
        const content = await callAgent(
          agent.systemPrompt,
          `Question: ${question}\n\nYour initial answer was:\n${ownInitial}\n\nHow the debate critiqued the answers so far:\n\n${critiquesBlock}\n\nGive your improved, final answer — incorporate valid critiques, defend points you still believe, and make this the best version of your answer. 5-9 sentences.`,
          DEBATER_MODEL,
          700
        );
        await db.agentResponse.create({ data: { sessionId, agentId: agent.id, round: "IMPROVED", content } });
        return { agent, content };
      })
    );

    // Round 4 — Wisdom Judge scores the final (improved) answers
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "SCORING" } });
    const answersBlock = improved.map((r) => `### ${r.agent.name} (key: ${r.agent.key})\n${r.content}`).join("\n\n");
    const validKeys = improved.map((r) => r.agent.key);
    const scores = await scoreAnswers(judgeAgent.systemPrompt, question, answersBlock, validKeys);

    await Promise.all(
      scores.map((s) => {
        const agent = debaters.find((a) => a.key === s.agentKey)!;
        const total = s.truth + s.evidence + s.depth + s.practicality + s.riskAwareness + s.originality + s.clarity + s.longTermValue;
        return db.agentScore.create({
          data: {
            sessionId, agentId: agent.id,
            truth: s.truth, evidence: s.evidence, depth: s.depth, practicality: s.practicality,
            riskAwareness: s.riskAwareness, originality: s.originality, clarity: s.clarity, longTermValue: s.longTermValue,
            total, rationale: s.rationale,
          },
        });
      })
    );

    // Round 5 — Synthesis Agent produces the Deep Wisdom Answer
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "SYNTHESIZING" } });
    const scoresBlock = scores
      .map((s) => {
        const agent = debaters.find((a) => a.key === s.agentKey)!;
        const total = s.truth + s.evidence + s.depth + s.practicality + s.riskAwareness + s.originality + s.clarity + s.longTermValue;
        return `${agent.name}: ${total}/80 — ${s.rationale}`;
      })
      .join("\n");
    const synthesisContent = await callAgent(
      synthesisAgent.systemPrompt,
      `Question: ${question}\n\nFinal answers from each agent:\n\n${answersBlock}\n\nWisdom Judge's scores:\n${scoresBlock}\n\nProduce the Deep Wisdom Answer.`,
      SYNTHESIS_MODEL,
      3000
    );
    await db.finalSynthesis.create({ data: { sessionId, content: synthesisContent } });

    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "DONE", completedAt: new Date() } });
  } catch (err) {
    console.error("[arena] pipeline failed:", err);
    await db.arenaSession.update({
      where: { id: sessionId },
      data: { status: "FAILED", error: String(err instanceof Error ? err.message : err).slice(0, 500) },
    });
  }
}
