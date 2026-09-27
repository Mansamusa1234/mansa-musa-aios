import type { Metadata } from "next";
import ResearchDesk from "./ResearchDesk";

export const metadata: Metadata = {
  title: "Research Desk | MansaMusaAI",
  description: "Investigate claims with linked sources, competing evidence and recorded reviews.",
};

export default function ResearchPage() {
  return <ResearchDesk />;
}
