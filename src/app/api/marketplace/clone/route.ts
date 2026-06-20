import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { WisdomCategory } from "@/lib/wisdomAgents";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, name, description, systemPrompt } = await req.json() as {
    agentId?: string;
    name?: string;
    description?: string;
    systemPrompt?: string;
  };

  if (!agentId) return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

  const source = await db.marketplaceAgent.findUnique({ where: { id: agentId } });
  if (!source) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const slug = `${source.slug}-clone-${Date.now()}`;

  const cloned = await db.marketplaceAgent.create({
    data: {
      name: name ?? `${source.name} (Clone)`,
      slug,
      category: source.category as WisdomCategory,
      description: description ?? source.description,
      systemPrompt: systemPrompt ?? source.systemPrompt,
      icon: source.icon,
      color: source.color,
      planGate: source.planGate,
      sortOrder: 99,
    },
  });

  // Auto-deploy for the cloner
  await db.agentDeployment.create({
    data: { userId: session.user.id, agentId: cloned.id, isActive: true },
  });

  return NextResponse.json({ agent: cloned });
}
