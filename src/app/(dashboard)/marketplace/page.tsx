import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ensureMarketplaceAgentsSeeded } from "@/lib/wisdomAgents";
import MarketplaceContent from "./MarketplaceContent";

export const metadata: Metadata = { title: "Agent Marketplace | MansaMusaAI" };
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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

  const catalog = agents.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    category: a.category as string,
    description: a.description,
    icon: a.icon,
    color: a.color,
    planGate: a.planGate,
    deployed: deployedIds.has(a.id),
    wins:          a.stats?.wins ?? 0,
    totalSessions: a.stats?.totalSessions ?? 0,
    winRate:       +(a.stats?.winRate ?? 0).toFixed(1),
    accuracyScore: +(a.stats?.accuracyScore ?? 0).toFixed(1),
    avgRating:     +(a.stats?.avgRating ?? 0).toFixed(1),
  }));

  return <MarketplaceContent catalog={catalog} deployedCount={deployments.length} />;
}
