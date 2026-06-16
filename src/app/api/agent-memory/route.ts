import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AGENTS } from "@/data/agents";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = new URL(req.url).searchParams.get("agentId");
  if (!agentId || !AGENTS.some((a) => a.id === agentId)) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  const memory = await db.agentMemory.findUnique({
    where: { userId_agentId: { userId: session.user.id, agentId } },
  });
  return NextResponse.json({ content: memory?.content ?? "" });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId, content } = await req.json();
  if (!agentId || !AGENTS.some((a) => a.id === agentId)) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }
  if (typeof content !== "string" || content.length > 2000) {
    return NextResponse.json({ error: "Content must be a string under 2000 characters" }, { status: 400 });
  }

  await db.agentMemory.upsert({
    where: { userId_agentId: { userId: session.user.id, agentId } },
    create: { userId: session.user.id, agentId, content },
    update: { content },
  });
  return NextResponse.json({ success: true });
}
