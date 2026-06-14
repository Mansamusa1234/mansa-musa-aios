import type { Metadata } from "next";
import AgentsContent from "./AgentsContent";

export const metadata: Metadata = {
  title: "AI Agents",
  description:
    "Deploy 10 specialised AI agents for every business function — CEO, Finance, Legal, Developer, Marketing, Sales, Security and more. Your AI workforce, ready now.",
  keywords: ["AI Agents", "Business AI", "AI Workforce", "Autonomous AI", "AI Automation"],
  openGraph: {
    title: "AI Agents — MansaMusaAI",
    description: "Your AI workforce, ready to deploy. 10 specialised agents for every business function.",
  },
};

export default function AgentsPage() {
  return <AgentsContent />;
}
