import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await db.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json() as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Key name required" }, { status: 400 });

  const count = await db.apiKey.count({ where: { userId: session.user.id } });
  if (count >= 10) return NextResponse.json({ error: "Maximum 10 API keys" }, { status: 400 });

  const rawKey = `mm_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.slice(0, 10);
  const keyHash = hashKey(rawKey);

  await db.apiKey.create({
    data: { userId: session.user.id, name: name.trim(), keyHash, prefix },
  });

  return NextResponse.json({ key: rawKey, prefix, name: name.trim() });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.apiKey.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
