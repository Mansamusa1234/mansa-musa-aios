import type { Metadata } from "next";
import EnterpriseContent from "./EnterpriseContent";

export const metadata: Metadata = {
  title: "Enterprise — AI at Scale for Your Organization | MansaMusaAI",
  description:
    "MansaMusaAI for larger teams: the most capable AI models, an AI executive team, team accounts and a dedicated account manager.",
  keywords: ["enterprise AI", "AI platform enterprise", "AI executive team", "team accounts"],
  openGraph: {
    title: "Enterprise — MansaMusaAI",
    description: "Scale AI across your entire organization with enterprise controls, SLAs, and dedicated support.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: { canonical: "/enterprise" },
};

export default function EnterprisePage() {
  return <EnterpriseContent />;
}
