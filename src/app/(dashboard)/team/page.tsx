import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import TeamContent from "./TeamContent";

export const metadata: Metadata = {
  title: "Teams | MansaMusaAI",
  description: "Manage your teams, invite members, and control access permissions.",
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await db.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          invites: {
            where: { acceptedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  const teams = memberships.map((m) => {
    const t = m.team;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug ?? t.id,
      plan: t.plan,
      members: t.members.map((mem) => ({
        id: mem.id, userId: mem.userId, role: mem.role as TeamRole, joinedAt: mem.joinedAt,
        user: { id: mem.user.id, name: mem.user.name, email: mem.user.email as string | null },
      })),
      invites: t.invites.map((inv) => ({
        id: inv.id, email: inv.email, role: inv.role as TeamRole, createdAt: inv.createdAt,
      })),
    };
  });

  return (
    <TeamContent
      teams={teams}
      currentUserId={session.user.id}
    />
  );
}
