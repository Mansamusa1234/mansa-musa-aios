import type { Metadata } from "next";
import EnterpriseContent from "./EnterpriseContent";

export const metadata: Metadata = {
  title: "Enterprise — AI at Scale for Your Organization | MansaMusaAI",
  description:
    "Deploy MansaMusaAI across your entire organization. SSO, custom AI agents, dedicated infrastructure, SLA guarantees, volume pricing, and a dedicated customer success team.",
  keywords: ["enterprise AI", "AI platform enterprise", "custom AI agents", "SSO", "dedicated infrastructure"],
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
