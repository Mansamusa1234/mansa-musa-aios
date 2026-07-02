import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contacts = await db.outreachContact.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { contacts } = await req.json() as { contacts: { name: string; email: string; company?: string; industry?: string }[] };

  if (!contacts?.length) return NextResponse.json({ error: "No contacts provided" }, { status: 400 });

  const created = await db.outreachContact.createMany({
    data: contacts.map((c) => ({ ...c, campaignId: id })),
  });

  return NextResponse.json({ created: created.count });
}
