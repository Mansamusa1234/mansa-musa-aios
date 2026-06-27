import type { Metadata } from "next";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import WisdomLibraryClient from "./WisdomLibraryClient";
import { WISDOM_ENTRIES } from "@/lib/wisdomLibrary";

export const metadata: Metadata = {
  title: "Wisdom Library | MansaMusaAI",
  description: "The living library of law, ancient wisdom, etymology, philosophy, business principles, and universal truths — curated for the curious mind.",
  alternates: { canonical: "/wisdom-library" },
};

export default function WisdomLibraryPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <MarketingNav />
      <WisdomLibraryClient entries={WISDOM_ENTRIES} />
      <MarketingFooter />
    </div>
  );
}
