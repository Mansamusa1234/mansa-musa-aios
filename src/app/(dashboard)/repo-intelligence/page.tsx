import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RepoIntelligenceClient from "./RepoIntelligenceClient";

export const metadata: Metadata = {
  title: "Repo Intelligence | MansaMusaAI",
  description: "GitHub, Vercel, Abacus Supercomputer and AI codebase intelligence in one developer control centre.",
  robots: { index: false },
};

export default async function RepoIntelligencePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return <RepoIntelligenceClient />;
}
