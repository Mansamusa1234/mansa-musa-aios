import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";
import { withCron } from "@/lib/cronUtils";

// Pain points and hooks are framed as questions about enquiries, with no invented statistics.
const INDUSTRIES = [
  { name: "dental practice", pain: "new-patient enquiries arrive while the front desk is busy", hook: "a website chat that answers common questions and captures the enquiry" },
  { name: "accounting firm", pain: "enquiries arrive out of hours when nobody can reply", hook: "capturing out-of-hours enquiries from your website" },
  { name: "estate agency", pain: "buyer enquiries come in at all hours and speed matters", hook: "replying to website enquiries straight away" },
  { name: "restaurant", pain: "booking questions arrive during the busiest service", hook: "letting a website chat handle common questions while staff look after guests" },
  { name: "scaffolding company", pain: "quote requests come in while your team is on site", hook: "keeping every quote request in one pipeline" },
  { name: "car dealership", pain: "test drive enquiries need a quick reply", hook: "capturing and following up website enquiries" },
  { name: "solicitors firm", pain: "potential clients often contact more than one firm", hook: "making a good first impression on your website" },
  { name: "physiotherapy clinic", pain: "booking questions interrupt treatment sessions", hook: "letting clients book appointments without a phone call" },
];

export const GET = withCron(async () => {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % 4;
  const todayIndustries = INDUSTRIES.slice(dayIndex * 2, dayIndex * 2 + 2);
  const results: { industry: string; drafted: number }[] = [];

  for (const industry of todayIndustries) {
    let campaign = await db.outreachCampaign.findFirst({
      where: { industry: industry.name },
    });

    if (!campaign) {
      campaign = await db.outreachCampaign.create({
        data: {
          name: `UK ${industry.name.charAt(0).toUpperCase() + industry.name.slice(1)}s — AI Receptionist`,
          industry: industry.name,
          subject: `Your ${industry.name} is missing calls right now`,
        },
      });
    }

    const PROSPECT_NAMES = [
      { name: "the owner", company: `a UK ${industry.name}` },
      { name: "the practice manager", company: `a busy ${industry.name}` },
      { name: "the director", company: `an independent ${industry.name}` },
    ];

    let drafted = 0;
    for (const prospect of PROSPECT_NAMES) {
      try {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          messages: [{
            role: "user",
            content: `Write a short, punchy cold email from Darren Neil, Founder of MansaMusaAI, to ${prospect.name} at ${prospect.company} in the UK.

Industry-specific pain point: ${industry.pain}
Hook angle: ${industry.hook}

MansaMusaAI facts (state only these; do not invent statistics, results, prices or features, and do not mention phone answering, SMS or WhatsApp):
- An AI receptionist for the business's website chat: answers common questions and captures enquirers' details into a CRM
- Appointment booking and an AI executive team for strategy, sales, finance and marketing questions
- Free plan available; Starter £49/month, Professional £149/month, Enterprise £499/month
- Professional can be tried free for 14 days with no card after verifying an email address

Write 4 short paragraphs:
1. A hook about their industry situation (one sentence, no statistics)
2. What MansaMusaAI does (2 sentences, from the facts above only)
3. The price and the free plan / trial (from the facts above only)
4. CTA: "Reply and I'll send you a link to start free at mansamusainitiative.com"

Subject line: make it specific to their industry, not generic.
Output format: Subject: [subject]\n\n[body]
Keep under 150 words total. No fluff. No corporate speak.`,
          }],
        });

        const raw = response.content[0].type === "text" ? response.content[0].text : "";
        const subjectMatch = raw.match(/^Subject:\s*(.+)/m);
        const subject = subjectMatch ? subjectMatch[1].trim() : `Your ${industry.name} is missing calls right now`;
        const body = raw.replace(/^Subject:.+\n+/m, "").trim();

        await db.contentQueue.create({
          data: {
            type: "cold_outreach",
            title: `[${industry.name}] ${subject}`,
            content: body,
            status: "PENDING",
            metadata: JSON.stringify({
              campaignId: campaign.id,
              industry: industry.name,
              subject,
              prospectType: prospect.name,
            }),
          },
        });
        drafted++;
      } catch (err) {
        console.error(`[prospect-outreach] failed for ${industry.name}`, err);
      }
    }
    results.push({ industry: industry.name, drafted });
  }

  return { results };
});
