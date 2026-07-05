import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const comp = await db.agentCompetition.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { rank: "asc" },
        include: {
          agent: { select: { id: true, name: true, slug: true, icon: true, color: true, category: true } },
        },
      },
      asset: { select: { id: true, title: true }, take: 1 },
    },
  });

  if (!comp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comp.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(comp);
}
