import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About",
  description:
    "MansaMusaAI is on a mission to democratise enterprise-grade AI. Learn about our story, values, and vision for the future of work.",
  keywords: ["About MansaMusaAI", "AI Company", "AI Mission", "AI for Business"],
  openGraph: {
    title: "About — MansaMusaAI",
    description: "Our mission: put world-class AI in the hands of every business.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
