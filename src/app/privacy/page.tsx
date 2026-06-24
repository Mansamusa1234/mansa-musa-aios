import type { Metadata } from "next";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Privacy Policy | MansaMusaAI",
  description: "How MansaMusaAI collects, uses, and protects your personal information.",
};

const sections = [
  { title: "Information we collect", body: "We collect information you provide directly, such as your name, email address, and payment details when you register or subscribe. We also collect usage data, conversation metadata (not content), and technical identifiers to provide and improve our services." },
  { title: "How we use your information", body: "We use your information to provide AI services, process payments via Stripe, send transactional emails, improve platform performance, comply with legal obligations, and prevent fraud and abuse. We never sell your personal data." },
  { title: "AI conversations", body: "Your conversations with AI agents are processed by Anthropic's Claude API. Conversation content is stored securely in our database to enable history and agent memory features. You can delete your conversation history at any time from your portal." },
  { title: "Data retention", body: "We retain your account data while your account is active. Usage records are retained for billing and analytics purposes. You may request deletion of your account and associated data by contacting support@mansamusainitiative.com." },
  { title: "Cookies and tracking", body: "We use essential session cookies for authentication. We do not use third-party advertising trackers or share your browsing data with advertisers." },
  { title: "Security", body: "We use industry-standard encryption (TLS), bcrypt password hashing, rate limiting, two-factor authentication, and audit logging. Payment data is handled exclusively by Stripe and never stored on our servers." },
  { title: "Your rights (UK GDPR)", body: "You have the right to access, correct, or delete your personal data; restrict or object to processing; data portability; and to withdraw consent. Contact support@mansamusainitiative.com to exercise your rights." },
  { title: "Third-party services", body: "We use Stripe for payments, Anthropic for AI processing, Supabase for database hosting, and Vercel for infrastructure. Each provider has their own privacy policy and data processing agreements with us." },
  { title: "Contact", body: "For privacy queries, contact our Data Controller at support@mansamusainitiative.com or write to MansaMusaAI, United Kingdom." },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3">Legal</p>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 2026</p>
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
