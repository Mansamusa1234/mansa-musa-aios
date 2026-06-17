import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import WorkforceContent from "./WorkforceContent";

export const metadata: Metadata = {
  title: "Workforce OS | MansaMusaAI",
  description: "Hire a full AI workforce for your business in 5 minutes.",
};

export const dynamic = "force-dynamic";

export default async function WorkforcePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [leads, tickets, bookings, receptionist, deployedAgents, competitions, wisdomAssets] = await Promise.all([
    db.lead.count({ where: { userId } }),
    db.supportTicket.count({ where: { userId, status: { not: "CLOSED" } } }),
    db.calendarBooking.count({ where: { userId, startAt: { gte: new Date() } } }),
    db.receptionist.findUnique({ where: { userId } }),
    db.agentDeployment.count({ where: { userId, isActive: true } }),
    db.agentCompetition.count({ where: { userId } }),
    db.wisdomAsset.count({ where: { userId } }),
  ]);

  return (
    <WorkforceContent
      leadsCount={leads}
      openTickets={tickets}
      upcomingBookings={bookings}
      receptionistActive={!!receptionist?.isActive}
      receptionistChats={receptionist?.totalChats ?? 0}
      deployedAgents={deployedAgents}
      competitions={competitions}
      wisdomAssets={wisdomAssets}
    />
  );
}
