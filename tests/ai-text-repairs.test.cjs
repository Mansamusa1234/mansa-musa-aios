const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(env, routeResult) {
  const calls = { anthropic: 0, route: [] };
  const mocks = {
    '@/lib/anthropic': { anthropic: { messages: { create: async () => { calls.anthropic++; return { content: [{ type: 'text', text: 'from claude' }] }; } } } },
    '@/lib/routellm': { isRouteLlmConfigured: () => Boolean(env.ABACUS_API_KEY), routeLlmChat: async (input) => { calls.route.push(input); return routeResult; } },
  };
  const source = ts.transpileModule(fs.readFileSync('src/lib/aiText.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => mocks[n], process: { env }, Boolean, Error });
  return { lib: mod.exports, calls };
}
const input = { system: 'You are the CFO', messages: [{ role: 'user', content: 'Cash plan?' }], maxTokens: 50, anthropicModel: 'claude-x' };

test('prefers Anthropic when its key is set', async () => {
  const { lib, calls } = load({ ANTHROPIC_API_KEY: 'a', ABACUS_API_KEY: 'b' });
  const r = await lib.completeText(input);
  assert.equal(r.provider, 'anthropic'); assert.equal(r.text, 'from claude'); assert.equal(calls.route.length, 0);
});

test('falls back to RouteLLM with the system prompt first', async () => {
  const { lib, calls } = load({ ABACUS_API_KEY: 'b' }, { ok: true, status: 200, content: 'from abacus', model: 'gpt-x' });
  const r = await lib.completeText(input);
  assert.equal(r.provider, 'abacus'); assert.equal(r.text, 'from abacus'); assert.equal(calls.anthropic, 0);
  assert.equal(calls.route[0].messages[0].role, 'system'); assert.equal(calls.route[0].messages[0].content, 'You are the CFO'); assert.equal(calls.route[0].maxTokens, 50);
});

test('RouteLLM failure and missing providers throw instead of returning empty replies', async () => {
  await assert.rejects(load({ ABACUS_API_KEY: 'b' }, { ok: false, status: 401, content: null }).lib.completeText(input), /status 401/);
  await assert.rejects(load({}).lib.completeText(input), /No AI provider/);
  assert.equal(load({}).lib.isTextAiConfigured(), false);
});
