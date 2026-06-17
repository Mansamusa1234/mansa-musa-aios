import type { Metadata } from "next";
import AgentsContent from "./AgentsContent";

export const metadata: Metadata = {
  title: "41 AI Agents — Deploy Your Full AI Workforce",
  description:
    "Deploy 41 specialist AI agents for every business function — CEO, CFO, COO, Finance, Legal, Developer, Marketing, Sales, Security and 32 more. Plus the AI Competition System with 24 specialist competitors.",
  keywords: [
    "AI Agents",
    "Business AI Agents",
    "AI Workforce Platform",
    "Autonomous AI Agents",
    "CEO AI Agent",
    "Finance AI Agent",
    "Legal AI Agent",
    "41 AI agents",
    "AI Competition System",
    "Multi-agent AI",
  ],
  openGraph: {
    title: "41 AI Agents — Your Full AI Workforce | MansaMusaAI",
    description: "41 specialist AI agents for every business function. Deploy now — free plan available.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: { canonical: "/agents" },
};

export default function AgentsPage() {
  return <AgentsContent />;
}
