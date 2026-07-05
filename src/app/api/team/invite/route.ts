import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teamId, email, role } = await req.json() as {
    teamId?: string;
    email?: string;
    role?: "ADMIN" | "MEMBER" | "VIEWER";
  };

  if (!teamId || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const senderMembership = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!senderMembership || (senderMembership.role !== "OWNER" && senderMembership.role !== "ADMIN"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: existingUser.id } },
    });
    if (alreadyMember) return NextResponse.json({ error: "Already a team member" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await db.teamInvite.upsert({
    where: { teamId_email: { teamId, email } },
    create: { teamId, email, role: role ?? "MEMBER", expiresAt, token: randomBytes(32).toString("hex") },
    update: { role: role ?? "MEMBER", expiresAt, acceptedAt: null },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";
  const inviteUrl = `${appUrl}/team/accept/${invite.token}`;

  await sendEmail(
    email,
    `${session.user.name ?? "Someone"} invited you to join ${team.name} on MansaMusaAI`,
    `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#6366f1">You're invited to ${team.name}</h2>
      <p>${session.user.name ?? "A team admin"} has invited you to join <strong>${team.name}</strong> on MansaMusaAI as a <strong>${role ?? "Member"}</strong>.</p>
      <a href="${inviteUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Accept invitation</a>
      <p style="color:#888;font-size:12px">This invitation expires in 7 days. If you weren't expecting this, you can ignore it.</p>
    </div>`
  ).catch(() => {});

  return NextResponse.json({ success: true, invite: { id: invite.id, email: invite.email, role: invite.role } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteId } = await req.json() as { inviteId?: string };
  if (!inviteId) return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });

  const invite = await db.teamInvite.findUnique({
    where: { id: inviteId },
    include: { team: true },
  });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId: session.user.id } },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.teamInvite.delete({ where: { id: inviteId } });
  return NextResponse.json({ success: true });
}
