import type { Metadata } from "next";
import LaunchContent from "./LaunchContent";

export const metadata: Metadata = {
  title: "Launch Day — MansaMusaAI is live",
  description: "The world's first AI Wisdom Economy is open. 24 specialist AI agents compete, judge, and produce Wisdom Assets on any business question. Try it free today.",
  openGraph: {
    title: "MansaMusaAI is live — AI Operating System for Business",
    description: "Deploy 24 specialist AI agents. Run competitions. Build your Wisdom Vault. Start free.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export default function LaunchPage() {
  return <LaunchContent />;
}
