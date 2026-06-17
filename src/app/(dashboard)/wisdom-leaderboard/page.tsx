import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CATEGORY_META } from "@/lib/wisdomAgents";
import WisdomLeaderboard from "./WisdomLeaderboard";

export const metadata: Metadata = { title: "Agent Leaderboard | MansaMusaAI" };
export const dynamic = "force-dynamic";

export default async function WisdomLeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agents = await db.marketplaceAgent.findMany({
    include: { stats: true },
    orderBy: { sortOrder: "asc" },
  });

  const leaderboard = agents
    .map((a) => ({
      id: a.id, name: a.name, slug: a.slug, icon: a.icon, color: a.color,
      category: a.category as string,
      categoryLabel: CATEGORY_META[a.category as keyof typeof CATEGORY_META]?.label ?? a.category,
      categoryIcon:  CATEGORY_META[a.category as keyof typeof CATEGORY_META]?.icon ?? "🤖",
      wins:          a.stats?.wins ?? 0,
      losses:        a.stats?.losses ?? 0,
      totalSessions: a.stats?.totalSessions ?? 0,
      winRate:       +(a.stats?.winRate ?? 0).toFixed(1),
      accuracyScore: +(a.stats?.accuracyScore ?? 0).toFixed(1),
      avgRating:     +(a.stats?.avgRating ?? 0).toFixed(1),
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.accuracyScore - a.accuracyScore);

  const totalCompetitions = await db.agentCompetition.count({ where: { status: "DONE" } });
  const totalAssets = await db.wisdomAsset.count();

  return <WisdomLeaderboard leaderboard={leaderboard} totalCompetitions={totalCompetitions} totalAssets={totalAssets} />;
}
