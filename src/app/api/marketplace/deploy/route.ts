import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePlan, planDisplayName, type Plan } from "@/lib/subscription";

const PLAN_ORDER: Record<Plan, number> = { free: 0, basic: 1, pro: 2, enterprise: 3 };

const schema = z.object({ agentId: z.string(), action: z.enum(["deploy", "undeploy"]) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });

  const agent = await db.marketplaceAgent.findUnique({ where: { id: body.data.agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (body.data.action === "deploy") {
    const userPlan = await getActivePlan(session.user.id);
    const requiredTier = (agent.planGate as Plan) ?? "basic";
    if (PLAN_ORDER[userPlan] < PLAN_ORDER[requiredTier]) {
      return NextResponse.json(
        { error: `This agent requires the ${planDisplayName(requiredTier)} plan or higher.`, requiresUpgrade: true },
        { status: 403 },
      );
    }
  }

  if (body.data.action === "deploy") {
    await db.agentDeployment.upsert({
      where: { userId_agentId: { userId: session.user.id, agentId: agent.id } },
      create: { userId: session.user.id, agentId: agent.id, isActive: true },
      update: { isActive: true },
    });
  } else {
    await db.agentDeployment.updateMany({
      where: { userId: session.user.id, agentId: agent.id },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
