import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORY_META } from "@/lib/wisdomAgents";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await db.marketplaceAgent.findMany({
    include: { stats: true },
    orderBy: { sortOrder: "asc" },
  });

  const leaderboard = agents
    .map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      icon: a.icon,
      color: a.color,
      category: a.category,
      categoryLabel: CATEGORY_META[a.category as keyof typeof CATEGORY_META]?.label ?? a.category,
      wins:          a.stats?.wins ?? 0,
      losses:        a.stats?.losses ?? 0,
      totalSessions: a.stats?.totalSessions ?? 0,
      winRate:       +(a.stats?.winRate ?? 0).toFixed(1),
      accuracyScore: +(a.stats?.accuracyScore ?? 0).toFixed(1),
      avgRating:     +(a.stats?.avgRating ?? 0).toFixed(1),
      ratingCount:   a.stats?.ratingCount ?? 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.accuracyScore - a.accuracyScore);

  // Category-level aggregates
  const byCategory = new Map<string, { wins: number; sessions: number; agents: number }>();
  for (const a of leaderboard) {
    const cur = byCategory.get(a.category) ?? { wins: 0, sessions: 0, agents: 0 };
    cur.wins += a.wins;
    cur.sessions += a.totalSessions;
    cur.agents += 1;
    byCategory.set(a.category, cur);
  }

  return NextResponse.json({ leaderboard, byCategory: Object.fromEntries(byCategory) });
}
