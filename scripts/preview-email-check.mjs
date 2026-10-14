// Preview builds only, and only when the commit message contains "[email-check]": sends one real email from
// each production sender address through Resend to Resend's simulated-delivery inbox (delivered@resend.dev),
// then reads back Resend's delivery event. Proves the API key works and the sender domain is verified,
// without emailing a person. Writes to the build log only; never prints the key. Never fails the build.
const SENDERS = [
  process.env.EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL ?? "MansaMusaAI <sales@mansamusainitiative.com>",
  process.env.EMAIL_FROM_WELCOME ?? "MansaMusaAI <greetings@mansamusainitiative.com>",
];
if (process.env.VERCEL_ENV !== "preview" || !(process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "").includes("[email-check]")) {
  console.log("[email-check] skipped (needs a Preview build whose commit message contains [email-check])");
  process.exit(0);
}
const key = process.env.RESEND_API_KEY?.trim();
if (!key) { console.log("[email-check] RESEND_API_KEY is not set for Preview"); process.exit(0); }
const api = (path, init = {}) => fetch(`https://api.resend.com${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(20000) })
  .then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const scrub = (v) => JSON.stringify(v).split(key).join("[redacted]").slice(0, 300);

const results = [];
for (const from of SENDERS) {
  const sent = await api("/emails", { method: "POST", body: JSON.stringify({
    from, to: ["delivered@resend.dev"], subject: "MansaMusaAI delivery check",
    html: "<p>Automated delivery check from a Preview build. No action needed.</p>",
  }) }).catch((e) => ({ status: 0, body: { message: String(e) } }));
  if (sent.status !== 200 || !sent.body.id) { results.push({ from, ok: false, status: sent.status, error: scrub(sent.body) }); continue; }
  let lastEvent = null;
  for (let i = 0; i < 10 && !["delivered", "bounced", "complained"].includes(lastEvent); i++) {
    await new Promise((r) => setTimeout(r, 3000));
    lastEvent = (await api(`/emails/${sent.body.id}`).catch(() => ({ body: {} }))).body.last_event ?? lastEvent;
  }
  results.push({ from, ok: lastEvent === "delivered", id: sent.body.id, lastEvent });
}
const domains = await api("/domains").catch(() => ({ body: {} }));
console.log("[email-check]", JSON.stringify({
  commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  results,
  domains: (domains.body.data ?? []).map((d) => ({ name: d.name, status: d.status, region: d.region })),
}));
