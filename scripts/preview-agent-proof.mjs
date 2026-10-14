// Preview builds only, and only when the commit message contains "[agent-proof]": asks the app's own
// C-suite agents (their real system prompts) to complete one concrete task per department via RouteLLM.
// Output goes to the Vercel build log only (team access). Never fails the build; never prints the key.
import { readFileSync } from "node:fs";
import ts from "typescript";

if (process.env.VERCEL_ENV !== "preview" || !(process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "").includes("[agent-proof]")) {
  console.log("[agent-proof] skipped (needs a Preview build whose commit message contains [agent-proof])");
  process.exit(0);
}
const key = process.env.ABACUS_API_KEY?.trim();
if (!key) { console.log("[agent-proof] skipped (ABACUS_API_KEY not set)"); process.exit(0); }

const source = ts.transpileModule(readFileSync("src/lib/csuiteAgents.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
new Function("module", "exports", source)(mod, mod.exports);
const { CSUITE_BY_ROLE } = mod.exports;

const product = "Mansa Musa AI (mansamusainitiative.com): an AI receptionist and AI executive team for UK small businesses and tradespeople; plans Free, Starter, Professional, Enterprise.";
const TASKS = [
  ["engineering", "cto", "List the 3 highest-priority technical checks before launching paid subscriptions on a Next.js + Stripe + Postgres app. One line each."],
  ["security", "compliance", "Give 3 concrete UK GDPR obligations for an AI receptionist that records caller details. One line each."],
  ["marketing", "cmo", "Write a one-sentence positioning statement and 3 campaign angles aimed at UK plumbers and electricians."],
  ["content-video", "cmo", "Write a 20-second vertical video script (max 6 short lines) about never missing a customer call. End with mansamusainitiative.com."],
  ["social-distribution", "growth", "Write one caption each for Instagram, TikTok and Facebook promoting a free trial. Max 25 words each, no invented statistics."],
  ["sales-crm", "cso", "Write a 3-step follow-up sequence (day 0, 2, 5) for a tradesperson who started a trial but has not connected their phone number. One line each."],
  ["research", "research", "Name 3 types of UK small business most likely to lose revenue from missed calls, with a one-line reason each. Do not invent statistics."],
  ["finance-revenue", "cfo", "Explain in 3 lines how to calculate monthly recurring revenue and churn for a subscription business with monthly and annual plans."],
  ["operations-analytics", "data", "Define 4 KPIs for a SaaS funnel from visitor to paid subscriber, with the formula for each. One line each."],
];

const results = [];
for (const [department, role, task] of TASKS) {
  const agent = CSUITE_BY_ROLE[role];
  const started = Date.now();
  try {
    const res = await fetch(process.env.ABACUS_ROUTELLM_URL || "https://routellm.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.ABACUS_ROUTELLM_MODEL || "route-llm", max_tokens: 400,
        messages: [{ role: "system", content: `${agent.systemPrompt}\n\nBusiness context: ${product}` }, { role: "user", content: `${task} Answer directly; no clarifying questions.` }] }),
      signal: AbortSignal.timeout(60000),
    });
    const body = await res.json().catch(() => ({}));
    results.push({ department, agent: `${agent.name}, ${agent.title}`, task, ok: res.ok, status: res.status, ms: Date.now() - started,
      model: body?.model ?? null, usage: body?.usage ?? null,
      output: res.ok ? body?.choices?.[0]?.message?.content ?? null : JSON.stringify(body).split(key).join("[redacted]").slice(0, 300) });
  } catch (err) {
    results.push({ department, agent: agent.name, task, ok: false, ms: Date.now() - started, output: err instanceof Error ? err.message : String(err) });
  }
}
const report = { checkedAt: new Date().toISOString(), commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null, passed: results.filter((r) => r.ok && r.output).length, of: results.length, results };
console.log("[agent-proof]", JSON.stringify(report));
