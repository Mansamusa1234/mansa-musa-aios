import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import WisdomContent from "./WisdomContent";

export const metadata: Metadata = { title: "Wisdom Vault | MansaMusaAI" };
export const dynamic = "force-dynamic";

export default async function WisdomPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const assets = await db.wisdomAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      agent: { select: { name: true, icon: true, color: true, category: true } },
      user:  { select: { name: true } },
    },
  });

  const totalAssets      = await db.wisdomAsset.count();
  const totalCompetitions = await db.agentCompetition.count({ where: { status: "DONE" } });

  const serialized = assets.map((a) => ({
    id:         a.id,
    title:      a.title,
    category:   a.category as string,
    prompt:     a.prompt,
    content:    a.content.slice(0, 280),
    agentName:  a.agent.name,
    agentIcon:  a.agent.icon,
    agentColor: a.agent.color,
    views:      a.views,
    saves:      a.saves,
    avgRating:  a.avgRating,
    ratingCount: a.ratingCount,
    createdAt:  a.createdAt.toISOString(),
    userName:   a.user.name ?? "Anonymous",
  }));

  return <WisdomContent assets={serialized} totalAssets={totalAssets} totalCompetitions={totalCompetitions} />;
}
