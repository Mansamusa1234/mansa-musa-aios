import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "MansaMusaAI", template: "%s | MansaMusaAI" },
  description:
    "MansaMusaAI — a powerful AI assistant built for everyone. Chat, create, and get things done.",
  keywords: ["AI", "chatbot", "assistant", "productivity"],
  openGraph: {
    type: "website",
    title: "MansaMusaAI",
    description: "Powerful AI assistant for everyone.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
