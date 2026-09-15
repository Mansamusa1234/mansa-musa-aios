import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | MansaMusaAI",
  description: "Cookies and similar technologies used by MansaMusaAI.",
};

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-700">
      <h1 className="mb-3 text-3xl font-bold text-gray-900">Cookie Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: 15 September 2026</p>
      <div className="space-y-7">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">What cookies are</h2>
          <p>Cookies and local storage are small records placed on your device. They can keep you signed in, protect a login flow, remember preferences, attribute a referral, and—only when allowed—measure usage or advertising results.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Necessary storage</h2>
          <p>Necessary storage supports authentication sessions, OAuth security state, themes, cookie preferences, and referral or affiliate attribution. These functions are required to provide a feature you request or to keep the service secure. Referral attribution may remain for up to 90 days.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Analytics</h2>
          <p>If you consent, configured analytics providers may measure page visits, product events, device information, and approximate location derived from network data. Depending on configuration, these may include Google Analytics, Microsoft Clarity, PostHog, or Mixpanel. Analytics scripts remain disabled until analytics consent is granted.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Marketing</h2>
          <p>If you separately consent, configured advertising technologies such as Meta Pixel or TikTok Pixel may measure campaign performance and support audience advertising. Marketing scripts remain disabled until marketing consent is granted.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Your choices</h2>
          <p>You can accept, reject, or customise optional categories in the cookie banner. You can clear the stored choice in your browser to make the banner appear again. Browser controls can also delete or block storage, although blocking necessary cookies may stop sign-in and other requested features from working.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Contact</h2>
          <p>Questions about cookies or personal data can be sent to support@mansamusainitiative.com.</p>
        </section>
      </div>
    </main>
  );
}
