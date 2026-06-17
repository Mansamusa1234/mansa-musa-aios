import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CompeteContent from "./CompeteContent";

export const metadata: Metadata = { title: "Agent Competition | MansaMusaAI" };
export const dynamic = "force-dynamic";

export default async function CompetePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <CompeteContent />;
}
