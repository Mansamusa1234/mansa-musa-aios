import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (typeof name !== "string" || name.trim().length < 1 || name.length > 100) {
    return NextResponse.json({ error: "Name must be 1-100 characters." }, { status: 400 });
  }

  await db.user.update({ where: { id: session.user.id }, data: { name: name.trim() } });
  return NextResponse.json({ success: true });
}
