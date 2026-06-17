import type { Metadata } from "next";
import WisdomArenaMarketing from "./WisdomArenaMarketing";

export const metadata: Metadata = {
  title: "Wisdom Arena — AI Multi-Agent Debate System",
  description: "Six specialist AI agents debate your hardest business questions, critique each other, and synthesise a scored consensus answer. The world's most advanced AI decision system.",
  openGraph: {
    title: "Wisdom Arena — AI Multi-Agent Debate by MansaMusaAI",
    description: "Six AI agents. One question. The best answer wins. Try Wisdom Arena free.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export default function WisdomArenaPage() {
  return <WisdomArenaMarketing />;
}
