import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, priceCents, description } = await req.json() as {
    agentId?: string;
    priceCents?: number;
    description?: string;
  };

  if (!agentId || !priceCents) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (priceCents < 100) return NextResponse.json({ error: "Minimum price is £1" }, { status: 400 });

  const agent = await db.marketplaceAgent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const deployment = await db.agentDeployment.findUnique({
    where: { userId_agentId: { userId: session.user.id, agentId } },
  });
  if (!deployment) return NextResponse.json({ error: "You must deploy this agent first" }, { status: 403 });

  const existing = await db.agentListing.findFirst({
    where: { agentId, sellerId: session.user.id },
  });

  const listing = existing
    ? await db.agentListing.update({
        where: { id: existing.id },
        data: { priceCents, description: description ?? null, isActive: true },
      })
    : await db.agentListing.create({
        data: { agentId, agentType: agent.category, name: agent.name, sellerId: session.user.id, priceCents, description: description ?? null, config: {} },
      });

  return NextResponse.json({ listing });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await req.json() as { agentId?: string };
  if (!agentId) return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

  await db.agentListing.updateMany({
    where: { agentId, sellerId: session.user.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const listings = await db.agentListing.findMany({
    where: { isActive: true },
    include: {
      seller: { select: { name: true } },
      _count: { select: { purchases: true } },
    },
    orderBy: { downloads: "desc" },
    take: 50,
  });

  return NextResponse.json({ listings });
}
