import type { Metadata } from "next";
import RepoIntelligenceClient from "./RepoIntelligenceClient";

export const metadata: Metadata = {
  title: "Repo Intelligence | MansaMusaAI",
  description:
    "Turn GitHub repositories into visual maps, AI-readable context, and browser-based development workspaces.",
};

export default function RepoIntelligencePage() {
  return <RepoIntelligenceClient />;
}
