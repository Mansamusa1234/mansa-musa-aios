import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await db.outreachCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { contacts: true } } },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, industry, subject } = await req.json();
  if (!name || !subject) return NextResponse.json({ error: "Name and subject required" }, { status: 400 });

  const campaign = await db.outreachCampaign.create({
    data: { name, industry, subject },
  });

  return NextResponse.json({ campaign });
}
