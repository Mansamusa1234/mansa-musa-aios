import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import WisdomAssetView from "./WisdomAssetView";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const asset = await db.wisdomAsset.findUnique({ where: { id }, select: { title: true } });
  return { title: asset ? `${asset.title} | Wisdom Vault` : "Wisdom Asset" };
}

export default async function WisdomAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const asset = await db.wisdomAsset.findUnique({
    where: { id },
    include: {
      agent:  { select: { name: true, icon: true, color: true, slug: true } },
      user:   { select: { name: true } },
      ratings: { where: { userId: session.user.id }, select: { rating: true } },
      competition: {
        include: {
          entries: {
            orderBy: { rank: "asc" },
            include: { agent: { select: { name: true, icon: true, color: true } } },
          },
        },
      },
    },
  });

  if (!asset) notFound();
  await db.wisdomAsset.update({ where: { id }, data: { views: { increment: 1 } } });

  return (
    <WisdomAssetView
      asset={{
        id: asset.id, title: asset.title, content: asset.content,
        category: asset.category as string, prompt: asset.prompt,
        agentName: asset.agent.name, agentIcon: asset.agent.icon, agentColor: asset.agent.color,
        views: asset.views + 1, saves: asset.saves,
        avgRating: asset.avgRating, ratingCount: asset.ratingCount,
        createdAt: asset.createdAt.toISOString(),
        userRating: asset.ratings[0]?.rating ?? null,
        entries: asset.competition.entries.map((e) => ({
          agentName: e.agent.name, agentIcon: e.agent.icon, agentColor: e.agent.color,
          score: e.score, rank: e.rank, rationale: e.rationale, response: e.response,
        })),
      }}
    />
  );
}
