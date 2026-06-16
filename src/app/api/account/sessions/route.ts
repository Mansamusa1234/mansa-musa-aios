import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const currentJti = token?.jti as string | undefined;

  const sessions = await db.trustedSession.findMany({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      ip: s.ip,
      userAgent: s.userAgent,
      rememberMe: s.rememberMe,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      isCurrent: !!currentJti && s.tokenId === currentJti,
    })),
  });
}
