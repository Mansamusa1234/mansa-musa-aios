const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(env, fetchImpl) {
  const source = ts.transpileModule(fs.readFileSync('src/lib/routellm.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, process: { env }, fetch: fetchImpl, AbortSignal, JSON, Date });
  return mod.exports;
}
const msg = [{ role: 'user', content: 'ping' }];

test('RouteLLM is not called without a key', async () => {
  let called = false; const r = load({}, async () => { called = true; });
  const res = await r.routeLlmChat({ messages: msg, maxTokens: 5 });
  assert.equal(res.ok, false); assert.match(res.error, /not set/); assert.equal(called, false); assert.equal(r.isRouteLlmConfigured(), false);
});

test('sends a bounded OpenAI-style request with bearer auth and parses the reply', async () => {
  let seen; const r = load({ ABACUS_API_KEY: 'sk-abc-123' }, async (url, init) => { seen = { url, init }; return { ok: true, status: 200, json: async () => ({ model: 'gpt-x', choices: [{ message: { content: 'RouteLLM OK' } }], usage: { total_tokens: 12 } }) }; });
  const res = await r.routeLlmChat({ messages: msg, maxTokens: 20 });
  assert.equal(seen.url, 'https://routellm.abacus.ai/v1/chat/completions');
  assert.equal(seen.init.headers.Authorization, 'Bearer sk-abc-123');
  const body = JSON.parse(seen.init.body); assert.equal(body.max_tokens, 20); assert.equal(body.model, 'route-llm');
  assert.equal(res.ok, true); assert.equal(res.content, 'RouteLLM OK'); assert.equal(res.model, 'gpt-x'); assert.equal(res.usage.total_tokens, 12);
});

test('provider errors are truncated and never contain the key', async () => {
  const r = load({ ABACUS_API_KEY: 'sk-abc-123' }, async () => ({ ok: false, status: 401, json: async () => ({ error: 'invalid key sk-abc-123 for account' }) }));
  const res = await r.routeLlmChat({ messages: msg, maxTokens: 5 });
  assert.equal(res.ok, false); assert.equal(res.status, 401); assert.doesNotMatch(res.error, /sk-abc-123/); assert.match(res.error, /\[redacted\]/);
});
