import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const cursor   = searchParams.get("cursor") ?? undefined;
  const take = 20;

  const assets = await db.wisdomAsset.findMany({
    where: category ? { category: category as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      agent: { select: { name: true, icon: true, color: true, category: true } },
      user:  { select: { name: true } },
    },
  });

  const hasMore = assets.length > take;
  const page = hasMore ? assets.slice(0, take) : assets;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({ assets: page, nextCursor });
}
