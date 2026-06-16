import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const arenaSession = await db.arenaSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: { synthesis: true },
  });
  if (!arenaSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (arenaSession.status !== "DONE" || !arenaSession.synthesis) {
    return NextResponse.json({ error: "Session is not complete yet" }, { status: 409 });
  }

  const summary = arenaSession.synthesis.content.slice(0, 280);
  const memory = await db.wisdomMemory.upsert({
    where: { sessionId },
    create: { userId: session.user.id, sessionId, question: arenaSession.question, summary },
    update: { summary },
  });

  return NextResponse.json({ success: true, id: memory.id });
}
