// One small RouteLLM request to verify the Abacus connection. Never prints the key.
// Usage: ABACUS_API_KEY="$(secret-tool lookup service abacus account routellm)" node scripts/abacus-routellm-check.mjs
const key = process.env.ABACUS_API_KEY?.trim();
const url = process.env.ABACUS_ROUTELLM_URL || "https://routellm.abacus.ai/v1/chat/completions";
if (!key) { console.error("ABACUS_API_KEY is not set"); process.exit(2); }
const started = Date.now();
const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: process.env.ABACUS_ROUTELLM_MODEL || "route-llm", max_tokens: 40,
    messages: [{ role: "user", content: "Reply with exactly: Mansa Musa RouteLLM connection OK" }] }),
  signal: AbortSignal.timeout(60000),
});
const body = await res.json().catch(() => ({}));
const result = {
  http: res.status,
  ms: Date.now() - started,
  model: body.model ?? null,
  reply: body.choices?.[0]?.message?.content?.slice(0, 120) ?? null,
  usage: body.usage ?? null,
  error: res.ok ? null : JSON.stringify(body).replaceAll(key, "[redacted]").slice(0, 300),
};
console.log(JSON.stringify(result, null, 2));
process.exit(res.ok ? 0 : 1);
