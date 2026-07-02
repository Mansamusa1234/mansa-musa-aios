import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { withCron } from "@/lib/cronUtils";

const AFFILIATE_PROFILES = [
  {
    type: "business coach",
    audience: "small business owners",
    angle: "recommend a tool your clients will thank you for — and earn 20% recurring every month they stay",
    earningsExample: "If 10 of your clients sign up on Professional (£149/mo), you earn £298/mo passively — £3,576/yr",
  },
  {
    type: "digital marketing agency",
    audience: "SMB clients who need automation",
    angle: "add MansaMusaAI to your service stack and earn recurring revenue without doing any extra work",
    earningsExample: "White-label our AI receptionist to your clients and earn 20% on every subscription — no tech work required",
  },
  {
    type: "accountant or bookkeeper",
    audience: "business owner clients",
    angle: "your clients trust your recommendations — recommend MansaMusaAI and earn 20% for life",
    earningsExample: "Recommend to 5 clients on Starter (£49/mo) = £49/mo in your pocket. Professional plan = £30/mo per client",
  },
  {
    type: "LinkedIn content creator in the SMB or AI space",
    audience: "UK entrepreneurs and founders",
    angle: "if you post about AI tools and business growth, your audience needs this",
    earningsExample: "One post converting 20 followers to Starter = £196/mo recurring. No cap on earnings.",
  },
  {
    type: "virtual assistant or EA",
    audience: "business owners you support",
    angle: "recommend the tool that handles the repetitive reception work — and earn a cut every month",
    earningsExample: "Recommend to 3 clients = £30–£90/mo extra income just for sharing a link",
  },
];

export const GET = withCron(async () => {
  if (new Date().getDay() !== 1) {
    return { skipped: "Not Monday" };
  }

  let drafted = 0;

  for (const profile of AFFILIATE_PROFILES) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Write a short, direct affiliate recruitment email from Darren Neil, Founder of MansaMusaAI, to a ${profile.type}.

Their audience: ${profile.audience}
Angle for them: ${profile.angle}
Earnings example: ${profile.earningsExample}

MansaMusaAI affiliate programme:
- 20% recurring commission on every subscription they refer
- No cap, no minimum
- Automatic tracking via unique link
- Stripe coupon gives their referrals 10% off for 3 months (makes it easy to sell)
- Payouts monthly via bank transfer or PayPal
- Apply at: mansamusainitiative.com/affiliate

Write 4 short paragraphs:
1. What we do in one sentence (AI receptionist for UK businesses)
2. Why this is perfect for their audience (specific to their type)
3. The commission structure (concrete numbers from the earnings example)
4. CTA: "Reply to this email and I'll send your affiliate link within 24 hours" or "Apply directly at [url]"

Keep it under 180 words. Conversational, not corporate. No bullet lists.
Subject line on first line: Subject: [subject]`,
        }],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text : "";
      const subjectMatch = raw.match(/^Subject:\s*(.+)/m);
      const subject = subjectMatch ? subjectMatch[1].trim() : `Partner with MansaMusaAI — earn 20% recurring`;
      const body = raw.replace(/^Subject:.+\n+/m, "").trim();

      await db.contentQueue.create({
        data: {
          type: "affiliate_recruit",
          title: `[Affiliate Recruit] ${profile.type} — ${subject}`,
          content: body,
          status: "PENDING",
          metadata: JSON.stringify({ subject, partnerType: profile.type }),
        },
      });
      drafted++;
    } catch (err) {
      console.error(`[affiliate-recruit] failed for ${profile.type}`, err);
    }
  }

  return { drafted };
});
