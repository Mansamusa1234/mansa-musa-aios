import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AGENTS } from "@/data/agents";
import MarketplaceContent from "./MarketplaceContent";

export const metadata: Metadata = {
  title: "Agent Marketplace | MansaMusaAI",
  description: `Browse and deploy ${AGENTS.length} specialist AI agents for every business function.`,
};

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const session = await auth();
  const subscription = await db.subscription.findUnique({
    where: { userId: session!.user.id },
    select: { status: true, stripePriceId: true },
  });

  const activePlan =
    subscription?.status === "ACTIVE"
      ? (subscription.stripePriceId?.includes("enterprise")
          ? "enterprise"
          : subscription.stripePriceId?.includes("pro")
          ? "pro"
          : "basic")
      : "free";

  return <MarketplaceContent userPlan={activePlan} />;
}
