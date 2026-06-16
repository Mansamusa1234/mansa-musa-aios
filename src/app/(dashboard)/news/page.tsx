import type { Metadata } from "next";
import NewsContent from "./NewsContent";

export const metadata: Metadata = {
  title: "News Feed | MansaMusaAI",
  description: "Real-time business news, AI developments, and market updates curated by your AI agents.",
};

export default function NewsPage() {
  return <NewsContent />;
}
