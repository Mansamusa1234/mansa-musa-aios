import type { Metadata } from "next";
import SecurityContent from "./SecurityContent";

export const metadata: Metadata = {
  title: "Security — Enterprise-Grade Protection | MansaMusaAI",
  description:
    "MansaMusaAI is built on a security-first foundation. 256-bit TLS encryption, SOC 2 Type II-ready infrastructure, GDPR compliance, zero-trust architecture, and regular penetration testing.",
  keywords: ["AI security", "data privacy", "GDPR", "SOC 2", "enterprise AI security", "zero trust"],
  openGraph: {
    title: "Security — MansaMusaAI",
    description: "Enterprise-grade security built into every layer of our platform.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return <SecurityContent />;
}
