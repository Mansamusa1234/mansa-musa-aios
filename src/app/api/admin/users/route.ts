import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      subscription: { select: { status: true, stripePriceId: true } },
      _count: { select: { conversations: true } },
    },
  });

  return NextResponse.json(users);
}
