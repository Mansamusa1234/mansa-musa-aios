import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the MansaMusaAI team. We're here to help with questions about our AI platform, enterprise plans, and partnerships.",
  keywords: ["Contact MansaMusaAI", "AI Platform Support", "Enterprise AI Contact"],
  openGraph: {
    title: "Contact — MansaMusaAI",
    description: "We'd love to hear from you. Get in touch with our team.",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
