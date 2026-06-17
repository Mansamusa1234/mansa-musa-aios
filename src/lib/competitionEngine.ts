import { db } from "./db";
import { anthropic } from "./anthropic";
import { ensureMarketplaceAgentsSeeded } from "./wisdomAgents";

const DEBATER_MODEL = "claude-haiku-4-5-20251001";
const JUDGE_MODEL   = "claude-sonnet-4-6";

interface ScoredEntry {
  agentId: string;
  score: number;
  rationale: string;
}

async function callAgent(systemPrompt: string, prompt: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: DEBATER_MODEL,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content.find((b) => b.type === "text");
    return block?.type === "text" ? block.text : "[No response]";
  } catch (err) {
    console.error("[competition] agent error:", err);
    return "[This agent could not generate a response.]";
  }
}

async function judgeEntries(
  prompt: string,
  entries: { agentId: string; agentName: string; response: string }[],
): Promise<ScoredEntry[]> {
  const answersBlock = entries
    .map((e) => `### ${e.agentName} (id: ${e.agentId})\n${e.response}`)
    .join("\n\n");

  const validIds = entries.map((e) => e.agentId);

  try {
    const msg = await anthropic.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 2000,
      system: `You are an impartial expert judge evaluating AI agent responses. Score each agent 0-100 based on:
- Accuracy and factual correctness (25 pts)
- Depth and analytical quality (25 pts)
- Practicality and actionability (25 pts)
- Clarity and structure (25 pts)
Be strict and differentiated — scores should spread across the range.`,
      messages: [{ role: "user", content: `Question/Prompt: ${prompt}\n\nAgent responses:\n\n${answersBlock}` }],
      tools: [{
        name: "submit_scores",
        description: "Submit scores for all agents",
        input_schema: {
          type: "object",
          properties: {
            scores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agentId: { type: "string", enum: validIds },
                  score: { type: "integer", minimum: 0, maximum: 100 },
                  rationale: { type: "string" },
                },
                required: ["agentId", "score", "rationale"],
              },
            },
          },
          required: ["scores"],
        },
      }],
      tool_choice: { type: "tool", name: "submit_scores" },
    });

    const toolUse = msg.content.find((b) => b.type === "tool_use");
    if (toolUse?.type === "tool_use") {
      const input = toolUse.input as { scores: ScoredEntry[] };
      const byId = new Map(input.scores.map((s) => [s.agentId, s]));
      if (validIds.every((id) => byId.has(id))) {
        return validIds.map((id) => {
          const s = byId.get(id)!;
          return { agentId: id, score: Math.max(0, Math.min(100, Math.round(Number(s.score) || 0))), rationale: s.rationale || "" };
        });
      }
    }
  } catch (err) {
    console.error("[competition] judge error:", err);
  }

  // Fallback: equal scores
  return entries.map((e) => ({ agentId: e.agentId, score: 50, rationale: "Fallback score — judge unavailable." }));
}

async function generateWisdomTitle(prompt: string, winnerResponse: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: DEBATER_MODEL,
      max_tokens: 60,
      system: "Generate a concise, compelling title (6-12 words) for a wisdom asset based on the question and winning response. Return ONLY the title, no quotes, no punctuation at the end.",
      messages: [{ role: "user", content: `Question: ${prompt}\n\nWinning response preview: ${winnerResponse.slice(0, 300)}` }],
    });
    const block = msg.content.find((b) => b.type === "text");
    return block?.type === "text" ? block.text.trim().replace(/["'.]+$/, "") : "Wisdom Insight";
  } catch {
    return "Wisdom Insight";
  }
}

export async function runCompetition(competitionId: string): Promise<void> {
  await ensureMarketplaceAgentsSeeded();

  const comp = await db.agentCompetition.findUnique({
    where: { id: competitionId },
    select: { prompt: true, category: true, userId: true },
  });
  if (!comp) return;

  const agents = await db.marketplaceAgent.findMany({
    where: { category: comp.category },
    orderBy: { sortOrder: "asc" },
  });

  if (agents.length < 2) {
    await db.agentCompetition.update({
      where: { id: competitionId },
      data: { status: "FAILED", error: "Not enough agents in this category" },
    });
    return;
  }

  try {
    // Step 1 — all agents respond in parallel
    const responses = await Promise.all(
      agents.map(async (agent) => {
        const response = await callAgent(agent.systemPrompt, comp.prompt);
        await db.competitionEntry.create({
          data: { competitionId, agentId: agent.id, response, score: 0, rank: 0 },
        });
        return { agentId: agent.id, agentName: agent.name, response };
      }),
    );

    // Step 2 — judge scores all responses
    await db.agentCompetition.update({ where: { id: competitionId }, data: { status: "SCORING" } });
    const scores = await judgeEntries(comp.prompt, responses);

    // Step 3 — persist scores and ranks
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    for (const [rank, scored] of sorted.entries()) {
      await db.competitionEntry.updateMany({
        where: { competitionId, agentId: scored.agentId },
        data: { score: scored.score, rank: rank + 1, rationale: scored.rationale },
      });
    }

    // Step 4 — update agent stats
    for (const [rank, scored] of sorted.entries()) {
      const isWin = rank === 0;
      await db.agentMarketStats.upsert({
        where: { agentId: scored.agentId },
        create: {
          agentId: scored.agentId,
          wins: isWin ? 1 : 0,
          losses: isWin ? 0 : 1,
          totalSessions: 1,
          winRate: isWin ? 100 : 0,
          accuracyScore: scored.score,
        },
        update: {
          wins: { increment: isWin ? 1 : 0 },
          losses: { increment: isWin ? 0 : 1 },
          totalSessions: { increment: 1 },
          accuracyScore: scored.score, // latest session score (simplification)
        },
      });
    }

    // Recalculate win rates in bulk
    for (const scored of sorted) {
      const stats = await db.agentMarketStats.findUnique({ where: { agentId: scored.agentId } });
      if (stats && stats.totalSessions > 0) {
        await db.agentMarketStats.update({
          where: { agentId: scored.agentId },
          data: { winRate: (stats.wins / stats.totalSessions) * 100 },
        });
      }
    }

    // Step 5 — create Wisdom Asset from winner
    const winner = sorted[0];
    const winnerEntry = responses.find((r) => r.agentId === winner.agentId);
    if (winnerEntry) {
      const title = await generateWisdomTitle(comp.prompt, winnerEntry.response);
      await db.wisdomAsset.create({
        data: {
          competitionId,
          agentId: winner.agentId,
          userId: comp.userId,
          title,
          content: winnerEntry.response,
          category: comp.category,
          prompt: comp.prompt,
        },
      });
    }

    await db.agentCompetition.update({
      where: { id: competitionId },
      data: { status: "DONE", completedAt: new Date() },
    });
  } catch (err) {
    console.error("[competition] pipeline failed:", err);
    await db.agentCompetition.update({
      where: { id: competitionId },
      data: { status: "FAILED", error: String(err instanceof Error ? err.message : err).slice(0, 500) },
    });
  }
}
