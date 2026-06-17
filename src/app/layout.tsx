import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Analytics from "@/components/analytics/Analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const BASE = "https://mansamusaai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "MansaMusaAI — AI Operating System for Business",
    template: "%s | MansaMusaAI",
  },
  description:
    "MansaMusaAI is the AI Operating System for modern business. Deploy AI agents, automate workflows, and scale operations with fintech-grade infrastructure powered by Claude.",
  keywords: [
    "AI Operating System",
    "AI Agents",
    "Business Automation",
    "Fintech AI",
    "AI Productivity Platform",
    "Claude AI",
    "AI SaaS",
    "Enterprise AI",
    "AI Workflow Automation",
    "AI Business Intelligence",
  ],
  authors: [{ name: "MansaMusaAI", url: BASE }],
  creator: "MansaMusaAI",
  publisher: "MansaMusaAI",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: BASE,
    siteName: "MansaMusaAI",
    title: "MansaMusaAI — AI Operating System for Business",
    description:
      "Deploy AI agents, automate workflows, and scale your business with the most powerful AI operating system available.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MansaMusaAI — AI Operating System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MansaMusaAI — AI Operating System for Business",
    description:
      "Deploy AI agents, automate workflows, and scale your business.",
    images: ["/opengraph-image"],
    creator: "@mansamusaai",
    site: "@mansamusaai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: BASE },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "MansaMusaAI",
      url: BASE,
      description:
        "AI Operating System for business automation, fintech, and productivity",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "hello@mansamusaai.com",
        availableLanguage: "English",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      url: BASE,
      name: "MansaMusaAI",
      description: "AI Operating System for Business",
      publisher: { "@id": `${BASE}/#organization` },
      inLanguage: "en-GB",
    },
    {
      "@type": "SoftwareApplication",
      name: "MansaMusaAI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: BASE,
      description:
        "Deploy AI agents and automate business workflows with MansaMusaAI — the AI Operating System for modern business.",
      offers: [
        { "@type": "Offer", name: "Free",       price: "0",   priceCurrency: "GBP", availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Basic",      price: "19",  priceCurrency: "GBP", availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Pro",        price: "49",  priceCurrency: "GBP", availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Enterprise", price: "199", priceCurrency: "GBP", availability: "https://schema.org/InStock" },
      ],
      featureList: [
        "AI Agents Hub",
        "Streaming AI responses",
        "Multi-model support (Haiku, Sonnet, Opus)",
        "Business automation",
        "Fintech-grade billing",
        "Enterprise security",
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MansaMusaAI" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
