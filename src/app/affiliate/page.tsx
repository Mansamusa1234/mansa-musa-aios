import type { Metadata } from "next";
import AffiliateContent from "./AffiliateContent";

export const metadata: Metadata = {
  title: "Affiliate Program — Earn 20% Recurring Commission",
  description:
    "Join the MansaMusaAI affiliate program and earn 20% recurring commission on every subscription you refer. Monthly payouts, 60-day cookie window, real-time tracking dashboard.",
  keywords: [
    "AI Affiliate Program",
    "SaaS Affiliate",
    "Recurring Commission",
    "Passive Income AI",
    "MansaMusaAI Affiliate",
    "Earn with AI",
    "AI Partner Program",
    "20% commission SaaS",
  ],
  openGraph: {
    title: "Affiliate Program — Earn 20% Recurring Commission | MansaMusaAI",
    description:
      "Refer customers to MansaMusaAI and earn 20% recurring commission every month they stay subscribed. Monthly payouts via Stripe.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MansaMusaAI Affiliate Program — Earn 20% Recurring",
    description: "Earn 20% recurring commission on every referral. Monthly payouts. Real-time dashboard.",
  },
  alternates: { canonical: "/affiliate" },
};

export default function AffiliatePage() {
  return <AffiliateContent />;
}
