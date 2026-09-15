import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | MansaMusaAI",
  description: "How MansaMusaAI collects, uses, shares, retains, and protects personal data.",
};

const sections = [
  ["1. Who we are", "MansaMusaAI, operated through mansamusainitiative.com, is the controller for account, billing, website, and direct-marketing data. When a business customer uses our receptionist, CRM, messaging, or automation tools for its own contacts, that customer is normally the controller and MansaMusaAI acts as its processor."],
  ["2. Data we collect", "We may process account details, contact details, authentication and security records, subscription and transaction references, support messages, business configuration, CRM records, appointment details, messages, call metadata and transcripts or recordings when enabled, uploaded content, device and IP data, and product-usage events. Payment-card details are collected by Stripe and are not stored by MansaMusaAI."],
  ["3. Sources", "We receive data from you, your organisation, people who contact a customer through an enabled channel, authentication providers you choose, payment and communications providers, and our service logs. Customers must have a lawful basis before uploading or connecting third-party personal data."],
  ["4. Purposes and lawful bases", "We use data to deliver and secure the service, authenticate users, prevent fraud, process subscriptions, provide support, communicate service changes, improve reliability, and meet legal duties. Depending on the activity, our UK GDPR lawful basis is performance of a contract, legitimate interests in operating and securing the service, compliance with law, or consent where required. You may withdraw consent at any time without affecting earlier processing."],
  ["5. AI processing", "Messages, prompts, transcripts, and related context may be sent to configured AI providers to generate requested outputs. AI responses can be inaccurate and should be reviewed before important decisions. Customers must not submit special-category, highly confidential, or unlawful data unless their plan, configuration, and lawful basis expressly permit it."],
  ["6. Service providers and sharing", "We do not sell personal data. We use providers for hosting and delivery (including Vercel and database providers), payments (Stripe), communications (such as Twilio and Resend), AI processing (such as Anthropic or OpenAI when enabled), authentication, analytics, and error monitoring. We may also disclose data where required by law, to protect rights and safety, or in connection with a business transfer. The providers actually used depend on the features you enable."],
  ["7. International transfers", "Some providers may process data outside the United Kingdom. Where required, we rely on appropriate safeguards such as UK adequacy regulations, the UK International Data Transfer Agreement or Addendum, and provider contractual and security commitments."],
  ["8. Retention", "We keep account and service data while an account is active and for a limited period afterward for security, dispute, tax, and legal purposes. Security logs, reset tokens, communications, recordings, transcripts, CRM data, and backups may have different retention periods. We delete or anonymise data when it is no longer needed, subject to legal holds and backup rotation. Customers control the retention and deletion of data they place in the service."],
  ["9. Security", "We use encrypted transport, provider-managed encryption at rest where available, access controls, password hashing, optional two-factor authentication, audit records, webhook signature checks, input validation, rate limiting, security headers, and Vercel platform DDoS protection. No internet service can guarantee absolute security; please report suspected issues promptly."],
  ["10. Your rights", "Under UK data-protection law you may have rights to access, correct, erase, restrict, object, receive a portable copy, and complain to the Information Commissioner’s Office. We may need to verify your identity. If your data was collected by one of our business customers, contact that customer first; we will assist them as required."],
  ["11. Calls, messages, and consent", "Customers are responsible for giving legally required notices and obtaining consent for call recording, electronic marketing, cookies, and automated communications. Do not use the service for unsolicited or unlawful marketing. Recipients must be given a working way to opt out where required."],
  ["12. Cookies and analytics", "We use essential cookies for sign-in, security, preferences, referrals, and core operation. We only use optional analytics or advertising technologies where configured and where an appropriate consent mechanism is in place. You can also control cookies through your browser."],
  ["13. Children", "The service is intended for businesses and people aged 18 or over. It is not directed to children, and customers must not knowingly use it to collect children’s data without an appropriate lawful basis and safeguards."],
  ["14. Changes and contact", "We may update this policy and will change the date shown here when we do. For privacy requests or questions, email support@mansamusainitiative.com. You may also complain to the UK Information Commissioner’s Office at ico.org.uk."],
] as const;

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-3 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: 15 September 2026</p>
      <p className="mb-8 text-gray-700">This policy explains how personal data is handled when you visit or use MansaMusaAI.</p>
      <section className="space-y-7 text-gray-700">
        {sections.map(([title, body]) => (
          <div key={title}>
            <h2 className="mb-2 text-xl font-semibold">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
