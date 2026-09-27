import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseBusinessResearch } from "@/lib/researchAccess";

const input = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canUseBusinessResearch(session.user.id, session.user.role)) {
    return NextResponse.json({ error: "Professional or Enterprise plan required" }, { status: 403 });
  }
  try {
    const investigations = await db.investigation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, description: true, updatedAt: true, _count: { select: { claims: true, sources: true } } },
    });
    return NextResponse.json({ investigations });
  } catch (error) {
    console.error("[investigations] list failed", error);
    return NextResponse.json({ error: "Research records are unavailable. Apply the database schema first." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await canUseBusinessResearch(session.user.id, session.user.role)) {
    return NextResponse.json({ error: "Professional or Enterprise plan required" }, { status: 403 });
  }
  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a title (3–160 characters) and an optional description." }, { status: 400 });
  try {
    const investigation = await db.investigation.create({
      data: { userId: session.user.id, ...parsed.data },
    });
    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    console.error("[investigations] create failed", error);
    return NextResponse.json({ error: "Could not save the investigation." }, { status: 503 });
  }
}
