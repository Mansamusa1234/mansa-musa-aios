import type { Metadata } from "next";
import FreeAuditContent from "./FreeAuditContent";

export const metadata: Metadata = {
  title: "Free AI Business Audit | MansaMusaAI — Find Out What AI Can Automate",
  description:
    "Get a free personalised AI audit for your business. Discover which tasks AI can automate, how much time you'll save, and the exact ROI you can expect. Takes 90 seconds.",
  keywords: ["free AI audit", "AI business automation", "AI ROI calculator", "AI for small business UK"],
  alternates: { canonical: "/free-audit" },
};

export default function FreeAuditPage() {
  return <FreeAuditContent />;
}
