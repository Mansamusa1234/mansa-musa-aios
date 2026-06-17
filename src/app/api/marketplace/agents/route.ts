import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureMarketplaceAgentsSeeded } from "@/lib/wisdomAgents";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureMarketplaceAgentsSeeded();

  const [agents, deployments] = await Promise.all([
    db.marketplaceAgent.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      include: { stats: true },
    }),
    db.agentDeployment.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { agentId: true },
    }),
  ]);

  const deployedIds = new Set(deployments.map((d) => d.agentId));

  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      category: a.category,
      description: a.description,
      icon: a.icon,
      color: a.color,
      planGate: a.planGate,
      deployed: deployedIds.has(a.id),
      stats: a.stats ?? { wins: 0, losses: 0, totalSessions: 0, winRate: 0, accuracyScore: 0, avgRating: 0, ratingCount: 0 },
    })),
  });
}
