import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const arenaSession = await db.arenaSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: {
      responses: {
        include: { agent: { select: { key: true, name: true, role: true, sortOrder: true } } },
        orderBy: { createdAt: "asc" },
      },
      scores: { include: { agent: { select: { key: true, name: true } } } },
      synthesis: true,
      memory: { select: { id: true } },
    },
  });
  if (!arenaSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: arenaSession.id,
    question: arenaSession.question,
    status: arenaSession.status,
    error: arenaSession.error,
    createdAt: arenaSession.createdAt,
    completedAt: arenaSession.completedAt,
    savedToVault: !!arenaSession.memory,
    responses: arenaSession.responses.map((r) => ({
      agentKey: r.agent.key,
      agentName: r.agent.name,
      agentRole: r.agent.role,
      sortOrder: r.agent.sortOrder,
      round: r.round,
      content: r.content,
      createdAt: r.createdAt,
    })),
    scores: arenaSession.scores.map((s) => ({
      agentKey: s.agent.key,
      agentName: s.agent.name,
      truth: s.truth, evidence: s.evidence, depth: s.depth, practicality: s.practicality,
      riskAwareness: s.riskAwareness, originality: s.originality, clarity: s.clarity, longTermValue: s.longTermValue,
      total: s.total, rationale: s.rationale,
    })),
    synthesis: arenaSession.synthesis?.content ?? null,
  });
}
