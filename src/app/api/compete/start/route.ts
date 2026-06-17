import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { after } from "next/server";
import { runCompetition } from "@/lib/competitionEngine";
import { ensureMarketplaceAgentsSeeded } from "@/lib/wisdomAgents";

const VALID_CATEGORIES = ["NEWS","FINANCE","RESEARCH","CODING","MARKETING","SALES","STRATEGY","OPERATIONS"] as const;

const schema = z.object({
  prompt: z.string().min(10).max(2000),
  category: z.enum(VALID_CATEGORIES),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

  await ensureMarketplaceAgentsSeeded();

  const agentCount = await db.marketplaceAgent.count({ where: { category: body.data.category } });
  if (agentCount < 2) return NextResponse.json({ error: "Not enough agents in this category." }, { status: 400 });

  const comp = await db.agentCompetition.create({
    data: {
      userId: session.user.id,
      prompt: body.data.prompt,
      category: body.data.category,
      status: "RUNNING",
    },
  });

  after(() => runCompetition(comp.id));

  return NextResponse.json({ competitionId: comp.id });
}
