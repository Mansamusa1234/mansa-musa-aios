import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Aggregate per-agent lifetime stats across all DONE sessions
  const rawScores = await db.agentScore.findMany({
    where: { session: { status: "DONE" } },
    select: {
      sessionId: true,
      agentId: true,
      total: true,
      session: { select: { completedAt: true } },
    },
  });

  // Group scores by session for win calculation, and by agent for stats
  const byAgent = new Map<string, { totalScoreSum: number; sessionCount: number; wins: number; lastSeen: Date | null }>();
  const perSession = new Map<string, { agentId: string; total: number }[]>();

  for (const s of rawScores) {
    // Per-agent accumulators
    const cur = byAgent.get(s.agentId) ?? { totalScoreSum: 0, sessionCount: 0, wins: 0, lastSeen: null };
    cur.totalScoreSum += s.total;
    cur.sessionCount += 1;
    const at = s.session?.completedAt ?? null;
    if (at && (!cur.lastSeen || at > cur.lastSeen)) cur.lastSeen = at;
    byAgent.set(s.agentId, cur);

    // Per-session grouping for win calculation
    const list = perSession.get(s.sessionId) ?? [];
    list.push({ agentId: s.agentId, total: s.total });
    perSession.set(s.sessionId, list);
  }

  // Count wins — agent with highest total in each session wins
  for (const [, contenders] of perSession) {
    if (!contenders.length) continue;
    const maxTotal = Math.max(...contenders.map((c) => c.total));
    for (const w of contenders.filter((c) => c.total === maxTotal)) {
      const cur = byAgent.get(w.agentId);
      if (cur) cur.wins += 1;
    }
  }

  // Fetch agent metadata
  const agentIds = [...byAgent.keys()];
  const agents = await db.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true, key: true },
  });

  const leaderboard = agents.map((agent) => {
    const stats = byAgent.get(agent.id)!;
    return {
      agentId: agent.id,
      name: agent.name,
      key: agent.key,
      wins: stats.wins,
      sessions: stats.sessionCount,
      avgScore: stats.sessionCount > 0 ? +(stats.totalScoreSum / stats.sessionCount).toFixed(1) : 0,
      lastSeen: stats.lastSeen,
    };
  });

  leaderboard.sort((a, b) => b.wins - a.wins || b.avgScore - a.avgScore);

  return NextResponse.json({ leaderboard });
}
