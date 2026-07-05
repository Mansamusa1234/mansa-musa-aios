import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ReceptionistContent from "./ReceptionistContent";

export const metadata: Metadata = {
  title: "AI Receptionist | MansaMusaAI",
  description: "Deploy an AI receptionist on your website to capture leads and answer enquiries 24/7.",
};

export const dynamic = "force-dynamic";

export default async function ReceptionistPage() {
  const session = await auth();
  const rec = await db.receptionist.findUnique({ where: { userId: session!.user.id } });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentChats, weeklyChats, leadsFromChats] = await Promise.all([
    rec ? db.receptionistChat.findMany({
      where: { receptionistId: rec.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }) : Promise.resolve([]),
    rec ? db.receptionistChat.count({
      where: { receptionistId: rec.id, createdAt: { gte: weekAgo } },
    }) : Promise.resolve(0),
    rec ? db.receptionistChat.count({
      where: { receptionistId: rec.id, visitorEmail: { not: null } },
    }) : Promise.resolve(0),
  ]);

  return (
    <ReceptionistContent
      receptionist={rec ? { id: rec.id, name: rec.name, greeting: rec.greeting, persona: rec.persona, businessHours: rec.businessHours, widgetColor: rec.widgetColor ?? "", isActive: rec.isActive, totalChats: rec.totalChats } : null}
      recentChats={recentChats.map((c) => ({ id: c.id, visitorName: c.visitorName, visitorEmail: c.visitorEmail, createdAt: c.createdAt }))}
      stats={{ weeklyChats, leadsFromChats, totalChats: rec?.totalChats ?? 0 }}
    />
  );
}
