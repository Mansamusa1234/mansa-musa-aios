import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrchestratorClient from "./OrchestratorClient";

export const metadata = {
  title: "Super Orchestrator — MansaMusaAI",
  description: "Parallel multi-model, multi-agent orchestration with Abacus Supercomputer and approval-controlled actions.",
};

export default async function OrchestratorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return <OrchestratorClient />;
}
