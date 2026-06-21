import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?next=/team/accept/${token}`);
  }

  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-[#070712] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <h1 className="text-xl font-bold text-white">Invalid or expired invitation</h1>
          <a href="/dashboard" className="text-indigo-400 hover:underline text-sm">Back to dashboard</a>
        </div>
      </div>
    );
  }

  // Check user email matches (or allow any logged-in user)
  if (invite.email !== session.user.email) {
    return (
      <div className="min-h-screen bg-[#070712] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Wrong account</h1>
          <p className="text-gray-400 text-sm">This invitation was sent to <strong>{invite.email}</strong>.<br />You&apos;re logged in as <strong>{session.user.email}</strong>.</p>
          <a href="/dashboard" className="text-indigo-400 hover:underline text-sm">Back to dashboard</a>
        </div>
      </div>
    );
  }

  // Accept the invite
  await db.teamMember.upsert({
    where: { teamId_userId: { teamId: invite.teamId, userId: session.user.id } },
    create: { teamId: invite.teamId, userId: session.user.id, role: invite.role },
    update: { role: invite.role },
  });

  await db.teamInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  redirect(`/team?joined=${invite.team.name}`);
}
