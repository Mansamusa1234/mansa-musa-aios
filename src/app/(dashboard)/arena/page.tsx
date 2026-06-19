import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getActivePlan, hasFeature } from "@/lib/subscription";
import ArenaContent from "./ArenaContent";

export const metadata: Metadata = {
  title: "Agent Arena | MansaMusaAI",
  description: "Watch specialist AI agents compete, score each other, and select the strongest answer to your question.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ session?: string }>;
}

export default async function ArenaPage({ searchParams }: Props) {
  const { session: initialSessionId } = await searchParams;
  const session = await auth();
  const plan = await getActivePlan(session!.user.id);
  const canUseArena = hasFeature(plan, "agent_arena");
  const canExportLetters = hasFeature(plan, "export_letter_pack");

  return <ArenaContent canUseArena={canUseArena} canExportLetters={canExportLetters} plan={plan} initialSessionId={initialSessionId} />;
}
