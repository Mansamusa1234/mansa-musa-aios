import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.affiliate.findUnique({ where: { userId: session.user.id } });
  if (existing) return NextResponse.json({ code: existing.code });

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = crypto.randomBytes(4).toString("hex");
    try {
      const affiliate = await db.affiliate.create({
        data: { userId: session.user.id, code },
      });
      return NextResponse.json({ code: affiliate.code });
    } catch {
      // unique collision on code — retry
    }
  }
  return NextResponse.json({ error: "Failed to create affiliate account" }, { status: 500 });
}
