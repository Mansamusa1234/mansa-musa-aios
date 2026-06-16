import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { runArenaPipeline } from "@/lib/arenaPipeline";
import { getActivePlan } from "@/lib/subscription";
import { after, NextResponse } from "next/server";

export const maxDuration = 300;

const ARENA_PLANS = ["pro", "enterprise"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await checkRateLimit(limiters.arena, session.user.id);
  if (limited) return limited;

  const plan = await getActivePlan(session.user.id);
  if (!ARENA_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Wisdom Arena requires a Pro or Enterprise plan." }, { status: 403 });
  }

  const { question } = await req.json();
  if (typeof question !== "string" || question.trim().length < 8 || question.length > 1000) {
    return NextResponse.json({ error: "Question must be between 8 and 1000 characters." }, { status: 400 });
  }

  const arenaSession = await db.arenaSession.create({
    data: { userId: session.user.id, question: question.trim() },
  });

  after(() => runArenaPipeline(arenaSession.id, arenaSession.question));

  return NextResponse.json({ sessionId: arenaSession.id }, { status: 201 });
}
