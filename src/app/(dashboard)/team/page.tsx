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

  const teams = memberships.map((m) => m.team);

  return (
    <TeamContent
      teams={teams}
      currentUserId={session.user.id}
    />
  );
}
