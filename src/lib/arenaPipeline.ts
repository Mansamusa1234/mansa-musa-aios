import { db } from "@/lib/db";
import type { Agent } from "@prisma/client";
import { anthropic } from "@/lib/anthropic";
import { DEBATER_KEYS, ensureArenaAgentsSeeded } from "@/lib/arenaAgents";
import { findDictionaryEntriesInText, formatDictionaryEntriesForPrompt, formatDictionarySources } from "@/lib/legalDictionary";
import { formatEvidenceForPrompt, formatEvidenceSourcesPanel, searchEvidenceChunks } from "@/lib/evidenceVault";

// Teams-within-teams competition pipeline:
// Team Alpha (fact/evidence focus) vs Team Beta (risk/commercial focus)
// Each team debates internally → produces team consensus → teams battle → synthesis picks winner

const DEBATER_MODEL = "claude-haiku-4-5-20251001";
const JUDGE_MODEL = "claude-sonnet-4-6";
const SYNTHESIS_MODEL = "claude-opus-4-8";

const TEAM_ALPHA_KEYS = ["research", "legal-dictionary", "evidence", "plain-english"] as const;
const TEAM_BETA_KEYS  = ["common-law", "statute", "risk", "commercial"] as const;

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

// Each team debates internally and produces a single team consensus answer
async function runTeamDebate(
  teamAgents: Agent[],
  teamName: string,
  question: string,
  context: string,
  sessionId: string
): Promise<string> {
  // Step 1: Each agent gives their individual answer
  const individualAnswers = await Promise.all(
    teamAgents.map(async (agent: Agent) => {
      const content = await callAgent(
        agent.systemPrompt,
        `Question: ${question}\n\n${context}\n\nYou are on ${teamName}. Give your specialist perspective in 4-6 sentences. Be direct and evidence-focused.`,
        DEBATER_MODEL,
        600
      );
      await db.agentResponse.create({ data: { sessionId, agentId: agent.id, round: "INITIAL", content } });
      return { agent, content };
    })
  );

  // Step 2: Each agent challenges teammates — within-team debate
  const challenged = await Promise.all(
    individualAnswers.map(async ({ agent, content: own }: { agent: Agent; content: string }) => {
      const othersBlock = individualAnswers
        .filter((r: { agent: Agent; content: string }) => r.agent.key !== agent.key)
        .map((r: { agent: Agent; content: string }) => `${r.agent.name}: ${r.content}`)
        .join("\n\n");
      const critique = await callAgent(
        agent.systemPrompt,
        `Question: ${question}\n\nYour initial answer: ${own}\n\nYour ${teamName} teammates answered:\n\n${othersBlock}\n\nChallenge any weak points in your teammates' answers and strengthen your own position in 3 sentences.`,
        DEBATER_MODEL,
        400
      );
      await db.agentResponse.create({ data: { sessionId, agentId: agent.id, round: "CRITIQUE", content: critique } });
      return { agent, improved: own + "\n\nRefinement: " + critique };
    })
  );

  // Step 3: Team produces a single consensus answer incorporating all perspectives
  const refinedBlock = challenged.map((r: { agent: Agent; improved: string }) => `${r.agent.name}:\n${r.improved}`).join("\n\n---\n\n");
  const consensus = await callAgent(
    `You are the ${teamName} consensus synthesiser. Your job is to take all your team members' answers and produce ONE unified team position — the strongest, most truthful answer the team collectively agrees on. Combine the best evidence, identify where teammates agreed, resolve disagreements in favour of the most supported position, and produce a clear, honest, well-structured answer. Never exaggerate or hide uncertainty.`,
    `Question: ${question}\n\n${teamName} members' refined answers:\n\n${refinedBlock}\n\nProduce the single strongest team consensus answer in 8-12 sentences. This will compete directly against the opposing team's consensus.`,
    JUDGE_MODEL,
    900
  );

  return consensus;
}

export async function runArenaPipeline(sessionId: string, question: string): Promise<void> {
  await ensureArenaAgentsSeeded();
  const dictionaryEntries = findDictionaryEntriesInText(question, 8);
  const dictionaryContext = formatDictionaryEntriesForPrompt(dictionaryEntries);
  const dictionarySources = formatDictionarySources(dictionaryEntries);
  const arenaOwner = await db.arenaSession.findUnique({ where: { id: sessionId }, select: { userId: true } });
  if (!arenaOwner) return;
  const evidenceSources = await searchEvidenceChunks(arenaOwner.userId, question, 6);
  const evidenceContext = formatEvidenceForPrompt(evidenceSources);
  const evidencePanel = formatEvidenceSourcesPanel(evidenceSources);

  const context = [
    dictionaryContext ? `Legal dictionary context (explanation only, not legal authority):\n${dictionaryContext}` : "",
    evidenceContext ? `Evidence Vault context. Cite exact labels like [E1] only when using these sources:\n${evidenceContext}` : "",
  ].filter(Boolean).join("\n\n");

  const allDebaters = await db.agent.findMany({ where: { key: { in: DEBATER_KEYS } }, orderBy: { sortOrder: "asc" } });
  const judgeAgent = await db.agent.findUnique({ where: { key: "wisdom-judge" } });
  const synthesisAgent = await db.agent.findUnique({ where: { key: "synthesis" } });

  if (!judgeAgent || !synthesisAgent || allDebaters.length !== DEBATER_KEYS.length) {
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "FAILED", error: "Arena agents are not seeded correctly" } });
    return;
  }

  const teamAlpha = allDebaters.filter((a) => (TEAM_ALPHA_KEYS as readonly string[]).includes(a.key));
  const teamBeta  = allDebaters.filter((a) => (TEAM_BETA_KEYS  as readonly string[]).includes(a.key));

  try {
    // ── Phase 1: Both teams debate internally in parallel ─────────────────────
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "DEBATING" } });

    const [alphaConsensus, betaConsensus] = await Promise.all([
      runTeamDebate(teamAlpha, "Team Alpha (Evidence & Facts)", question, context, sessionId),
      runTeamDebate(teamBeta,  "Team Beta (Law & Risk)", question, context, sessionId),
    ]);

    // Save team consensus responses
    const alphaLeader = teamAlpha[0];
    const betaLeader  = teamBeta[0];
    await Promise.all([
      db.agentResponse.create({ data: { sessionId, agentId: alphaLeader.id, round: "IMPROVED", content: `[TEAM ALPHA CONSENSUS]\n${alphaConsensus}` } }),
      db.agentResponse.create({ data: { sessionId, agentId: betaLeader.id,  round: "IMPROVED", content: `[TEAM BETA CONSENSUS]\n${betaConsensus}` } }),
    ]);

    // ── Phase 2: Teams cross-challenge each other ─────────────────────────────
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "CRITIQUING" } });

    const [alphaChallenge, betaChallenge] = await Promise.all([
      callAgent(
        `You are Team Alpha's spokesperson. Challenge Team Beta's answer — expose any weaknesses, missing evidence, legal errors, or overlooked risks. Be sharp and specific.`,
        `Question: ${question}\n\nTeam Alpha consensus:\n${alphaConsensus}\n\nTeam Beta consensus:\n${betaConsensus}\n\nChallenge Team Beta's answer in 4-6 sentences.`,
        JUDGE_MODEL, 500
      ),
      callAgent(
        `You are Team Beta's spokesperson. Challenge Team Alpha's answer — expose any weaknesses, missing evidence, legal errors, or overlooked risks. Be sharp and specific.`,
        `Question: ${question}\n\nTeam Beta consensus:\n${betaConsensus}\n\nTeam Alpha consensus:\n${alphaConsensus}\n\nChallenge Team Alpha's answer in 4-6 sentences.`,
        JUDGE_MODEL, 500
      ),
    ]);

    // ── Phase 3: Each team improves their answer after cross-challenge ─────────
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "IMPROVING" } });

    const [alphaFinal, betaFinal] = await Promise.all([
      callAgent(
        `You are Team Alpha's spokesperson. Defend your position and improve your answer after receiving Team Beta's challenge.`,
        `Question: ${question}\n\nYour team's consensus:\n${alphaConsensus}\n\nTeam Beta challenged you:\n${betaChallenge}\n\nDefend, correct, and strengthen your final answer in 8-10 sentences.`,
        JUDGE_MODEL, 800
      ),
      callAgent(
        `You are Team Beta's spokesperson. Defend your position and improve your answer after receiving Team Alpha's challenge.`,
        `Question: ${question}\n\nYour team's consensus:\n${betaConsensus}\n\nTeam Alpha challenged you:\n${alphaChallenge}\n\nDefend, correct, and strengthen your final answer in 8-10 sentences.`,
        JUDGE_MODEL, 800
      ),
    ]);

    // ── Phase 4: Wisdom Judge scores both teams' final answers ────────────────
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "SCORING" } });

    // Score individual agents too (using their IMPROVED round answers for leaderboard)
    const improvedResponses = await db.agentResponse.findMany({
      where: { sessionId, round: "IMPROVED" },
      include: { agent: true },
    });

    const agentAnswersBlock = improvedResponses
      .map((r) => `### ${r.agent.name} (key: ${r.agent.key})\n${r.content}`)
      .join("\n\n");

    const validKeys = [...TEAM_ALPHA_KEYS, ...TEAM_BETA_KEYS] as string[];
    const scores = await scoreAnswers(judgeAgent.systemPrompt, question, agentAnswersBlock, validKeys);

    await Promise.all(
      scores.map((s) => {
        const agent = allDebaters.find((a) => a.key === s.agentKey)!;
        if (!agent) return Promise.resolve();
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

    // Determine winning team
    const alphaKeys = TEAM_ALPHA_KEYS as readonly string[];
    const betaKeys  = TEAM_BETA_KEYS  as readonly string[];
    const alphaTotal = scores.filter((s) => alphaKeys.includes(s.agentKey)).reduce((acc, s) => acc + s.truth + s.evidence + s.depth + s.practicality + s.riskAwareness + s.originality + s.clarity + s.longTermValue, 0);
    const betaTotal  = scores.filter((s) => betaKeys.includes(s.agentKey)).reduce((acc, s) => acc + s.truth + s.evidence + s.depth + s.practicality + s.riskAwareness + s.originality + s.clarity + s.longTermValue, 0);
    const winningTeam   = alphaTotal >= betaTotal ? "Team Alpha (Evidence & Facts)" : "Team Beta (Law & Risk)";
    const winningAnswer = alphaTotal >= betaTotal ? alphaFinal : betaFinal;

    // ── Phase 5: Synthesis Agent produces the final Deep Wisdom Answer ────────
    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "SYNTHESIZING" } });

    const scoresBlock = scores
      .map((s) => {
        const agent = allDebaters.find((a) => a.key === s.agentKey)!;
        const total = s.truth + s.evidence + s.depth + s.practicality + s.riskAwareness + s.originality + s.clarity + s.longTermValue;
        return `${agent?.name ?? s.agentKey}: ${total}/80 — ${s.rationale}`;
      })
      .join("\n");

    const synthesisContent = await callAgent(
      synthesisAgent.systemPrompt,
      `Question: ${question}\n\n${context ? context + "\n\n" : ""}THE TEAM BATTLE:\n\nTeam Alpha final answer:\n${alphaFinal}\n\nTeam Beta final answer:\n${betaFinal}\n\nWinning team by judge score: ${winningTeam}\nWinning answer:\n${winningAnswer}\n\nAll agent scores:\n${scoresBlock}\n\nProduce the single most truthful, complete, honest answer possible. Draw on both teams' strongest points. Acknowledge where evidence is uncertain. Provide clear, practical next steps. Do not present legal theories as guaranteed law.${dictionarySources || evidencePanel ? `\n\nSources:\n${[dictionarySources, evidencePanel].filter(Boolean).join("\n")}` : ""}`,
      SYNTHESIS_MODEL,
      3000
    );

    await db.finalSynthesis.create({ data: { sessionId, content: synthesisContent } });

    // Auto-save WisdomMemory
    if (arenaOwner?.userId) {
      await db.wisdomMemory.upsert({
        where: { sessionId },
        create: { sessionId, userId: arenaOwner.userId, question, summary: synthesisContent.slice(0, 3000) },
        update: { summary: synthesisContent.slice(0, 3000) },
      });
    }

    await db.arenaSession.update({ where: { id: sessionId }, data: { status: "DONE", completedAt: new Date() } });
  } catch (err) {
    console.error("[arena] pipeline failed:", err);
    await db.arenaSession.update({
      where: { id: sessionId },
      data: { status: "FAILED", error: String(err instanceof Error ? err.message : err).slice(0, 500) },
    });
  }
}
