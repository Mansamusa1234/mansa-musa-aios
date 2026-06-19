import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import CRMContent from "./CRMContent";

export const metadata: Metadata = {
  title: "CRM | MansaMusaAI",
  description: "Manage your leads and sales pipeline with AI-powered CRM.",
};

export const dynamic = "force-dynamic";

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;

export default async function CRMPage() {
  const session = await auth();
  const leads = await db.lead.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const pipeline = STAGES.map((stage) => ({
    stage,
    leads: leads.filter((l) => l.stage === stage).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      company: l.company,
      value: l.value,
      source: l.source,
      notes: l.notes,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
  }));

  const totalValue = leads.filter((l) => l.stage === "WON").reduce((s, l) => s + l.value, 0);
  const wonCount = leads.filter((l) => l.stage === "WON").length;
  const pipelineValue = leads.filter((l) => !["WON", "LOST"].includes(l.stage)).reduce((s, l) => s + l.value, 0);

  return <CRMContent pipeline={pipeline} totalLeads={leads.length} totalValue={totalValue} wonCount={wonCount} pipelineValue={pipelineValue} userId={session!.user.id} />;
}
