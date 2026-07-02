import { anthropic } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { withCron } from "@/lib/cronUtils";

const DAILY_TASKS = [
  {
    role: "research",
    task: `You are Sophia, Head of Market Research. Today is ${new Date().toDateString()}.

Generate a daily intelligence briefing for MansaMusaAI covering:
1. ONE new AI tool, API, or technology released this week relevant to voice AI, receptionist automation, or UK SMB tools
2. ONE competitor move or market development (Voiceflow, Air.ai, Smith.ai, Goodcall, or similar)
3. ONE UK business trend or regulation change relevant to AI receptionists
4. ONE growth opportunity MansaMusaAI should explore in the next 30 days

Format as a crisp executive briefing. Be specific with names, tools, and actionable insights. Max 300 words.`,
  },
  {
    role: "growth",
    task: `You are Marcus, Head of Growth. Today is ${new Date().toDateString()}.

Generate today's growth intelligence report for MansaMusaAI:
1. ONE conversion optimisation idea for the mansamusainitiative.com landing page or signup flow
2. ONE new acquisition channel to test this week (specific tactic, not generic advice)
3. ONE retention improvement for reducing trial-to-paid churn
4. Key growth metric focus for today: which of (activation rate / trial conversion / MRR growth / NRR) needs most attention and why

Be specific and actionable. Reference UK SMB market context. Max 300 words.`,
  },
  {
    role: "cfo",
    task: `You are Morgan, CFO. Today is ${new Date().toDateString()}.

Generate today's financial health check for MansaMusaAI:
1. Key SaaS financial metrics to review today (MRR, churn, CAC, LTV ratio targets for a UK B2B SaaS at this stage)
2. ONE cost optimisation opportunity for an early-stage SaaS (API costs, tooling, infrastructure)
3. ONE revenue expansion opportunity (pricing, packaging, upsell)
4. Cash flow consideration for this month

Keep it practical for a growing UK SaaS. Max 300 words.`,
  },
  {
    role: "compliance",
    task: `You are Diana, Head of Compliance. Today is ${new Date().toDateString()}.

Generate today's compliance radar for MansaMusaAI (AI receptionist SaaS, UK-based, records calls, processes personal data):
1. ONE GDPR/ICO requirement most relevant to an AI voice recording business that needs checking
2. ONE upcoming UK AI regulation or guidance that MansaMusaAI should be aware of
3. ONE practical compliance action to complete this week
4. Risk rating for today: Green / Amber / Red and why

Max 200 words. Be specific to AI and voice recording businesses.`,
  },
  {
    role: "cmo",
    task: `You are Casey, CMO. Today is ${new Date().toDateString()}.

Generate today's marketing intelligence for MansaMusaAI:
1. ONE content idea for social media today (specific hook, angle, and which platform)
2. ONE SEO opportunity: a specific keyword or topic UK SMB owners search when they need an AI receptionist
3. ONE message that would resonate with UK tradespeople, salon owners, or restaurant owners right now
4. Campaign idea for this week: specific, low-budget, high-impact

Max 250 words. Focus on UK market and conversion.`,
  },
];

export const GET = withCron(async () => {
  const results: { role: string; success: boolean; error?: string }[] = [];

  for (const task of DAILY_TASKS) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: task.task }],
      });

      const content = response.content[0].type === "text" ? response.content[0].text : "";

      await db.agentIntelligenceReport.upsert({
        where: {
          agentRole_date: {
            agentRole: task.role,
            date: new Date().toISOString().split("T")[0],
          },
        },
        update: { content, updatedAt: new Date() },
        create: {
          agentRole: task.role,
          date: new Date().toISOString().split("T")[0],
          content,
        },
      });

      results.push({ role: task.role, success: true });
    } catch (err) {
      results.push({ role: task.role, success: false, error: String(err) });
    }
  }

  return {
    date: new Date().toISOString().split("T")[0],
    results,
  };
});
