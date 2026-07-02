import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { anthropic } from "@/lib/anthropic";

// Runs daily at 7am. AI generates a batch of cold outreach emails targeting
// UK SMBs in the industries most likely to buy (dentists, accountants, estate agents,
// restaurants, scaffolders, car dealerships, solicitors, physios).
// Each draft goes to Command Centre for Darren's approval before anything sends.

const INDUSTRIES = [
  { name: "dental practice", pain: "missed calls cost you £200-£500 per new patient", hook: "your receptionist can't answer every call at once" },
  { name: "accounting firm", pain: "clients calling after hours get voicemail and go elsewhere", hook: "your competitors are already using AI to capture leads 24/7" },
  { name: "estate agency", pain: "buyer enquiries come in at all hours and speed wins the instruction", hook: "the fastest to respond wins the listing" },
  { name: "restaurant", pain: "reservation calls go to answerphone and tables go unfilled", hook: "every missed reservation is £30-£80 straight off your bottom line" },
  { name: "scaffolding company", pain: "quote requests come in while your team is on site", hook: "you're losing contracts because you can't get back fast enough" },
  { name: "car dealership", pain: "test drive enquiries need instant responses or buyers go to a competitor", hook: "the dealership that responds in 5 minutes wins the sale" },
  { name: "solicitors firm", pain: "potential clients call once and never call back if they get voicemail", hook: "your first impression sets the tone for a £3,000+ matter" },
  { name: "physiotherapy clinic", pain: "appointment booking calls interrupt treatment sessions", hook: "your therapists should be treating patients, not answering phones" },
];

export async function GET(req: Request) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pick 2 industries per run (rotating through all 8 over 4 days)
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % 4;
  const todayIndustries = INDUSTRIES.slice(dayIndex * 2, dayIndex * 2 + 2);

  // Check if campaign for these industries already exists
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

    // Generate 5 prospect email drafts per industry per day
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

MansaMusaAI is an AI receptionist and business automation platform. Key offer:
- AI answers every call 24/7, books appointments, captures leads
- Starter plan from £49/month
- 14-day free trial, no credit card needed
- Pays for itself with one extra booking per month

Write 4 short paragraphs:
1. Specific hook about their industry pain (one sentence, bold statement)
2. What MansaMusaAI does (2 sentences, concrete)
3. The ROI (specific: costs less than one missed booking/call)
4. CTA: "Book a free 15-min demo at mansamusainitiative.com/demo" or "Reply YES and I'll send you a free trial link"

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

  return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() });
}
