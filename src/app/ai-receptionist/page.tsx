import type { Metadata } from "next";
import ReceptionistContent from "./ReceptionistContent";

export const metadata: Metadata = {
  title: "AI Receptionist — Never Miss a Lead Again | MansaMusaAI",
  description:
    "An AI receptionist for your website chat: answers enquiries about your business and captures leads into your CRM. Set up in minutes, no code required.",
  keywords: ["AI receptionist", "website chat AI", "lead capture", "appointment booking", "AI for small business"],
  openGraph: {
    title: "AI Receptionist — MansaMusaAI",
    description: "An AI receptionist for your website chat that captures leads into your CRM.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: { canonical: "/ai-receptionist" },
};

export default function ReceptionistPage() {
  return <ReceptionistContent />;
}
