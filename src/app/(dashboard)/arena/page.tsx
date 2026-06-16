import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getActivePlan } from "@/lib/subscription";
import ArenaContent from "./ArenaContent";

export const metadata: Metadata = {
  title: "Wisdom Arena | MansaMusaAI",
  description: "Watch specialist AI agents debate, critique, and synthesise the deepest answer to your question.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ session?: string }>;
}

export default async function ArenaPage({ searchParams }: Props) {
  const { session: initialSessionId } = await searchParams;
  const session = await auth();
  const plan = await getActivePlan(session!.user.id);
  const canUseArena = plan === "pro" || plan === "enterprise";

  return <ArenaContent canUseArena={canUseArena} plan={plan} initialSessionId={initialSessionId} />;
}
