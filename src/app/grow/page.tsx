import type { Metadata } from "next";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Grow Your Business with AI | MansaMusaAI",
  description: "Every marketing strategy, every revenue channel, every growth lever — all powered by AI. The complete playbook for scaling your business with MansaMusaAI.",
  alternates: { canonical: "/grow" },
};

const STRATEGIES = [
  {
    category: "🔥 Paid Acquisition",
    color: "border-red-500/20",
    accent: "text-red-400",
    strategies: [
      { name: "Google Search Ads", desc: "Target 'AI receptionist', 'AI for small business', 'missed calls solution'. High intent — people searching for exactly what you offer.", roi: "£3–8 return per £1 spent" },
      { name: "Facebook & Instagram Ads", desc: "Retargeting visitors who didn't sign up. Video ads showing AI answering calls. Lookalike audiences from your customer list.", roi: "Best for brand awareness" },
      { name: "LinkedIn Ads", desc: "Target decision-makers at SMEs by job title (MD, CEO, Operations Manager). Sponsor content about £30K lost to missed calls.", roi: "Highest B2B conversion" },
      { name: "YouTube Pre-roll", desc: "15-second unskippable ads targeting business content viewers. Show the brain rot format — AI answering a call while owner is on a job.", roi: "£0.01–0.03 per view" },
      { name: "TikTok Ads", desc: "Spark Ads boosting your organic brain rot videos. Target entrepreneurs 25–45. Massive organic amplification potential.", roi: "Lowest CPM of any platform" },
    ],
  },
  {
    category: "📣 Organic Social",
    color: "border-purple-500/20",
    accent: "text-purple-400",
    strategies: [
      { name: "TikTok Brain Rot Content", desc: "Split screen: Minecraft parkour top, product demo bottom. Post 3x daily. Hook in first 0.5 seconds. This is your fastest growth channel.", roi: "0 to 100K followers in 90 days" },
      { name: "LinkedIn Thought Leadership", desc: "Daily posts on AI, business automation, founder journey. Tag relevant people. Build authority as the voice of AI for UK SMEs.", roi: "B2B leads at zero cost" },
      { name: "X / Twitter Thread Strategy", desc: "Post one thread per week: '10 calls your business missed this week (and what it cost you)'. Repost with commentary. Build following fast.", roi: "Viral potential is highest" },
      { name: "YouTube Long-form", desc: "Weekly 10-minute videos: 'How I replaced my receptionist with AI', 'AI vs human: who handles the call better?'. SEO builds over time.", roi: "Compounding asset forever" },
      { name: "Instagram Reels", desc: "Repurpose TikTok content. Behind-the-scenes building the platform. Customer success stories. Product demos. Story polls.", roi: "Cross-platform amplification" },
    ],
  },
  {
    category: "🤝 Referral & Affiliate",
    color: "border-green-500/20",
    accent: "text-green-400",
    strategies: [
      { name: "20% Lifetime Affiliate Programme", desc: "Already built. Every affiliate earns 20% of every subscription they refer — forever. A £499/month customer earns them £100/month passively.", roi: "£0 acquisition cost" },
      { name: "Customer Referral Rewards", desc: "Give existing customers 1 free month for every paying customer they refer. Word-of-mouth from happy users is your most trusted channel.", roi: "3x higher conversion rate" },
      { name: "Partner with Accountants", desc: "Every UK accountant has 50–200 SME clients. One accountant recommending MansaMusaAI generates massive recurring revenue.", roi: "One partner = 20+ customers" },
      { name: "Agency Reseller Programme", desc: "Let marketing agencies white-label or resell MansaMusaAI to their clients. They take a cut, you get distribution at scale.", roi: "Exponential distribution" },
    ],
  },
  {
    category: "📧 Email Marketing",
    color: "border-blue-500/20",
    accent: "text-blue-400",
    strategies: [
      { name: "Welcome Sequence (7 emails)", desc: "Day 1: Welcome + quick win. Day 3: Case study. Day 5: Feature highlight. Day 7: First upgrade offer. Day 10: Social proof. Day 14: Trial expiry warning. Day 21: Win-back.", roi: "40–60% open rates" },
      { name: "Weekly Business AI Newsletter", desc: "Every Monday: one AI tip, one success story, one new feature. Build a list of 10,000 subscribers = 200+ paying customers.", roi: "£0.10–£1 per subscriber/month" },
      { name: "Behavioural Triggers", desc: "User signs up but doesn't deploy an agent → automated email at hour 2, day 2, day 5. User on free plan → upgrade email at day 7, 14, 30.", roi: "2–5x conversion uplift" },
      { name: "Re-engagement Campaigns", desc: "Monthly email to inactive users: 'Here's what you're missing.' Show them new agents, new features, new wins. Bring them back.", roi: "15–25% reactivation rate" },
    ],
  },
  {
    category: "🔍 SEO & Content",
    color: "border-cyan-500/20",
    accent: "text-cyan-400",
    strategies: [
      { name: "Long-tail Keyword Blogs", desc: "Blog posts targeting: 'AI receptionist for plumbers', 'AI booking system for dentists', 'automate sales follow up small business'. Each post = compounding traffic.", roi: "Free traffic forever" },
      { name: "Comparison Pages", desc: "Create pages: 'MansaMusaAI vs hiring a receptionist', 'AI vs VA (virtual assistant)', 'MansaMusaAI vs Tidio vs Intercom'. Capture high-intent buyers.", roi: "Highest conversion SEO traffic" },
      { name: "Local SEO",            desc: "Target: 'AI for small business UK', 'AI receptionist London', 'AI agents Birmingham'. Appear when local businesses search for solutions.", roi: "Highly targeted UK traffic" },
      { name: "YouTube SEO",          desc: "Every video optimised with keyword-rich title, description, timestamps. 'How AI answered 247 calls in one week (so I didn't have to)'.", roi: "Double platform reach" },
    ],
  },
  {
    category: "🎙️ PR & Media",
    color: "border-amber-500/20",
    accent: "text-amber-400",
    strategies: [
      { name: "Press Releases", desc: "Announce milestones: 1,000 customers, £1M in customer revenue saved, new enterprise features. Send to TechCrunch, Sifted, Wired, The Telegraph.", roi: "Free media coverage" },
      { name: "Podcast Appearances", desc: "Pitch yourself to UK entrepreneur podcasts: Diary of a CEO, How to Scale, Business Made Simple. 30 minutes = thousands of listeners.", roi: "Massive trust amplifier" },
      { name: "Awards & Recognition", desc: "Apply for: UK Tech Awards, Startups 100, Innovate UK grants, AI company of the year. Credibility that converts.", roi: "Permanent trust signal" },
      { name: "Case Studies & Media", desc: "Turn 3 customer wins into detailed case studies. Pitch to industry publications in their sector. A dental practice saving £2K/month is a story every dentist wants to read.", roi: "Niche authority builder" },
    ],
  },
  {
    category: "🤖 AI-Powered Marketing",
    color: "border-brand-500/20",
    accent: "text-brand-400",
    strategies: [
      { name: "Personalised Outreach at Scale", desc: "Use your own AI agents to research prospects, personalise cold emails, and follow up automatically. Outreach 1,000 prospects with the quality of 10.", roi: "10x outreach capacity" },
      { name: "AI-Generated Ad Creatives", desc: "Generate 50 ad variations in minutes. Test headlines, images, CTAs. Kill losers fast, scale winners. Continuous A/B testing at zero cost.", roi: "3x ad performance" },
      { name: "Chatbot Lead Qualification", desc: "AI chatbot on the website qualifies every visitor: what's your business, biggest challenge, team size. Route hot leads to calendar booking instantly.", roi: "40% more leads captured" },
      { name: "Predictive Churn Prevention", desc: "AI identifies customers about to cancel before they do — usage drops, login frequency, support tickets. Trigger automated save campaigns.", roi: "Recover 20–30% of churners" },
    ],
  },
];

export default function GrowPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <MarketingNav />

      {/* Hero */}
      <section className="px-6 py-24 bg-gradient-to-b from-gray-900 to-gray-950 border-b border-white/5">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">Every Strategy. Every Channel.</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            The Complete Playbook for<br className="hidden sm:block" /> Growing with AI
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Every marketing strategy available to a modern business — from paid ads to PR, from SEO to AI-powered outreach. All of it works. All of it is available to you today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="rounded-xl bg-brand-500 px-8 py-4 text-sm font-bold text-white hover:bg-brand-600 transition-colors shadow-xl shadow-brand-500/30">
              Start free today →
            </Link>
            <Link href="/affiliate" className="rounded-xl border border-white/10 px-8 py-4 text-sm font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-colors">
              Join the affiliate programme
            </Link>
          </div>
        </div>
      </section>

      {/* Revenue snapshot */}
      <section className="px-6 py-12 bg-gray-900/50 border-b border-white/5">
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: "£49", label: "Starter plan/month", sub: "Your first sale" },
            { value: "20%", label: "Affiliate commission", sub: "Recurring forever" },
            { value: "£498", label: "One Enterprise customer", sub: "Per year minimum" },
            { value: "∞",   label: "Revenue ceiling", sub: "No cap, no limit" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-brand-400">{s.value}</p>
              <p className="text-sm text-gray-300 mt-1">{s.label}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Strategies */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-16">
          {STRATEGIES.map((group) => (
            <div key={group.category}>
              <h2 className={`text-2xl font-extrabold mb-6 ${group.accent}`}>{group.category}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.strategies.map((s) => (
                  <div key={s.name} className={`rounded-2xl border bg-white/3 p-6 ${group.color}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-bold text-white">{s.name}</h3>
                      <span className="text-xs rounded-full border border-green-500/30 bg-green-500/10 text-green-400 px-2.5 py-0.5 whitespace-nowrap flex-shrink-0">{s.roi}</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-gray-900 border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Every strategy starts with one thing</h2>
          <p className="text-gray-400 mb-8 text-lg">A product that works. MansaMusaAI is live, built, and ready. Now it&apos;s time to put it in front of the world.</p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-all hover:-translate-y-0.5">
            Start free — no card needed →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
