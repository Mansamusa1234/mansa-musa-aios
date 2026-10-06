import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "PENDING";
  const type = searchParams.get("type");
  if (!["PENDING", "APPROVED", "REJECTED", "SENT"].includes(status)) return NextResponse.json({ error: "Invalid queue status." }, { status: 400 });

  const items = await db.contentQueue.findMany({
    where: {
      status: status as never,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = z.object({ type: z.enum(["social_post", "email", "lead_followup", "pr", "cold_outreach"]), platform: z.string().max(50).nullable().optional(), title: z.string().min(1).max(300), content: z.string().min(1).max(50000), metadata: z.string().max(10000).nullable().optional() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid queue draft." }, { status: 400 });
  const item = await db.contentQueue.create({ data: { ...parsed.data, status: "PENDING" } });
  return NextResponse.json({ item });
}
