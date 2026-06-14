import type { Metadata } from "next";
import FeaturesContent from "./FeaturesContent";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore every feature of the MansaMusaAI platform — streaming AI, multi-model intelligence, agent hub, enterprise security, Stripe billing, and mobile-first design.",
  keywords: ["AI Features", "AI Platform Features", "AI Streaming", "AI Models", "Enterprise AI Security"],
  openGraph: {
    title: "Features — MansaMusaAI",
    description: "Everything your business needs to operate at AI speed.",
  },
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
