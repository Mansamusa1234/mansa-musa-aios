import type { Metadata } from "next";
import IntelligenceContent from "./IntelligenceContent";

export const metadata: Metadata = {
  title: "Market Intelligence | MansaMusaAI",
  description: "Live market data, competitive intelligence, and sector analysis powered by AI.",
};

export default function IntelligencePage() {
  return <IntelligenceContent />;
}
