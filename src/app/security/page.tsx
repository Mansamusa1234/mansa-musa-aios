import type { Metadata } from "next";
import SecurityContent from "./SecurityContent";

export const metadata: Metadata = {
  title: "Security Practices | MansaMusaAI",
  description:
    "Learn about MansaMusaAI security controls, account protection, data safeguards, and responsible disclosure.",
  keywords: ["AI security", "data privacy", "GDPR", "SOC 2", "enterprise AI security", "zero trust"],
  openGraph: {
    title: "Security — MansaMusaAI",
    description: "Security controls and responsible disclosure information for MansaMusaAI.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return <SecurityContent />;
}
