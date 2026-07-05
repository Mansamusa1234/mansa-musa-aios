import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import VaultContent from "./VaultContent";

export const metadata: Metadata = {
  title: "Knowledge Vault | MansaMusaAI",
  description: "Your saved Wisdom Arena debates and Deep Wisdom Answers.",
};

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const session = await auth();
  const memories = await db.wisdomMemory.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <VaultContent
      memories={memories.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        question: m.question,
        summary: m.summary,
        savedAt: m.createdAt,
      }))}
    />
  );
}
