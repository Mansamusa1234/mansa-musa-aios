import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import TeamContent from "./TeamContent";

export const metadata: Metadata = {
  title: "Team | MansaMusaAI",
  description: "Manage your team members, roles, and access permissions.",
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  if (session!.user.role !== "ADMIN") redirect("/dashboard");

  const members = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
      _count: { select: { conversations: true } },
    },
  });

  return (
    <TeamContent
      members={members}
      currentUserId={session!.user.id}
      currentRole={session!.user.role ?? "USER"}
    />
  );
}
