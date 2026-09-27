import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import ResearchDesk from "./ResearchDesk";

export const metadata: Metadata = {
  title: "Research Desk | MansaMusaAI",
  description: "Investigate claims with linked sources, competing evidence and recorded reviews.",
};

export default async function ResearchPage() {
  const session = await auth();
  return <ResearchDesk isAdmin={session?.user?.role === "ADMIN"} />;
}
