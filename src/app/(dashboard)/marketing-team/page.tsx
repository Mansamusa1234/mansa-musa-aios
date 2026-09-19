import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import MarketingTeamClient from "./MarketingTeamClient";
import { isAbacusWorkerConfigured } from "@/lib/abacusWorker";

export const metadata: Metadata = {
  title: "AI Marketing Team | MansaMusaAI",
  description: "Run a coordinated AI marketing team that prepares multi-platform content for approval.",
};

export const dynamic = "force-dynamic";

export default async function MarketingTeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const pendingCount = await db.contentQueue.count({
    where: { type: "social_post", status: "PENDING" },
  });

  return (
    <MarketingTeamClient
      pendingCount={pendingCount}
      abacusConfigured={isAbacusWorkerConfigured()}
    />
  );
}
