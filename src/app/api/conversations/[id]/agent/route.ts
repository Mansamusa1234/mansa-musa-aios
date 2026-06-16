import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AGENTS } from "@/data/agents";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { agentId } = await req.json();

  if (agentId !== null && !AGENTS.some((a) => a.id === agentId)) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  const conversation = await db.conversation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, _count: { select: { messages: true } } },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (conversation._count.messages > 0) {
    return NextResponse.json({ error: "Agent can only be set before the first message" }, { status: 409 });
  }

  await db.conversation.update({ where: { id }, data: { agentId } });
  return NextResponse.json({ success: true });
}
