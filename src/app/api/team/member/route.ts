import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teamId, userId, role } = await req.json() as {
    teamId?: string;
    userId?: string;
    role?: string;
  };

  if (!teamId || !userId || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const senderMembership = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!senderMembership || senderMembership.role !== "OWNER")
    return NextResponse.json({ error: "Only team owner can change roles" }, { status: 403 });

  const updated = await db.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role: role as never },
  });

  return NextResponse.json({ success: true, member: updated });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teamId, userId } = await req.json() as { teamId?: string; userId?: string };
  if (!teamId || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const senderMembership = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  // Owner can remove anyone; members can only remove themselves
  const canRemove =
    senderMembership?.role === "OWNER" ||
    senderMembership?.role === "ADMIN" ||
    userId === session.user.id;

  if (!canRemove) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
  return NextResponse.json({ success: true });
}
