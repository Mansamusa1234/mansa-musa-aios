import type { Metadata } from "next";
import ReceptionistContent from "./ReceptionistContent";

export const metadata: Metadata = {
  title: "AI Receptionist — Never Miss a Lead Again | MansaMusaAI",
  description:
    "Your AI receptionist answers calls, qualifies leads, books appointments, and handles FAQs 24/7. Deploy in minutes. No code required. Works across phone, SMS, email, and web chat.",
  keywords: ["AI receptionist", "AI phone answering", "lead qualification AI", "appointment booking AI", "24/7 receptionist"],
  openGraph: {
    title: "AI Receptionist — MansaMusaAI",
    description: "Never miss a lead again. Your AI receptionist works 24/7 across every channel.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: { canonical: "/ai-receptionist" },
};

export default function ReceptionistPage() {
  return <ReceptionistContent />;
}
