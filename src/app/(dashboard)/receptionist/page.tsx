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
  const recentChats = rec ? await db.receptionistChat.findMany({
    where: { receptionistId: rec.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  }) : [];

  return (
    <ReceptionistContent
      receptionist={rec ? { id: rec.id, name: rec.name, greeting: rec.greeting, persona: rec.persona, businessHours: rec.businessHours, widgetColor: rec.widgetColor, isActive: rec.isActive, totalChats: rec.totalChats } : null}
      recentChats={recentChats.map((c) => ({ id: c.id, visitorName: c.visitorName, visitorEmail: c.visitorEmail, createdAt: c.createdAt }))}
    />
  );
}
