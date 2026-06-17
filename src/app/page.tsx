import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";
import { PLANS } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "MansaMusaAI — The AI Workforce OS | 41 AI Agents, Free Forever",
  description:
    "Deploy 41 specialist AI agents for every business function. Run multi-agent competitions. Explore the Wisdom Arena debate system. Start free — no card needed. Powered by Claude, GPT-4, Gemini, Grok & Mistral.",
  keywords: [
    "AI Operating System",
    "AI Agents for Business",
    "Business Automation AI",
    "AI Competition System",
    "Wisdom Arena AI",
    "AI Workforce",
    "Multi-agent AI",
    "Claude AI Platform",
    "AI SaaS UK",
    "Enterprise AI Platform",
  ],
  openGraph: {
    title: "MansaMusaAI — 41 AI Agents. One Platform. Free Forever.",
    description:
      "Deploy AI agents, run multi-agent competitions, and build your Wisdom Vault. The world's first AI Wisdom Economy — start free today.",
  },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <LandingPage plans={PLANS} />;
}
