import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import SupportContent from "./SupportContent";

export const metadata: Metadata = {
  title: "AI Support | MansaMusaAI",
  description: "AI-powered customer support ticketing with instant responses.",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await auth();
  const isAdmin = session!.user.role === "ADMIN";
  const tickets = await db.supportTicket.findMany({
    where: isAdmin ? {} : { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <SupportContent
      isAdmin={isAdmin}
      tickets={tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        body: t.body,
        status: t.status,
        priority: t.priority,
        aiResponse: t.aiResponse,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        userName: t.user.name,
        userEmail: t.user.email,
      }))}
    />
  );
}
