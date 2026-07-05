import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [asset] = await Promise.all([
    db.wisdomAsset.findUnique({
      where: { id },
      include: {
        user:   { select: { name: true } },
        ratings: { where: { userId: session.user.id }, select: { rating: true } },
        agentCompetition: {
          include: {
            entries: {
              orderBy: { rank: "asc" },
              include: { agent: { select: { name: true, icon: true, color: true } } },
            },
          },
        },
      },
    }),
    db.wisdomAsset.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => null),
  ]);

  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...asset,
    userRating: asset.ratings[0]?.rating ?? null,
  });
}

const rateSchema = z.object({ rating: z.number().int().min(1).max(5) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = rateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid rating" }, { status: 400 });

  await db.assetRating.upsert({
    where: { userId_assetId: { assetId: id, userId: session.user.id } },
    create: { assetId: id, userId: session.user.id, rating: body.data.rating },
    update: { rating: body.data.rating },
  });

  const agg = await db.assetRating.aggregate({ where: { assetId: id }, _avg: { rating: true }, _count: true });
  await db.wisdomAsset.update({
    where: { id },
    data: { avgRating: agg._avg.rating ?? 0, ratingCount: agg._count },
  });

  return NextResponse.json({ ok: true });
}
