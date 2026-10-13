const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function fixture(plan) {
  let ai = 0; const saved = [];
  const mocks = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } },
    'zod': require('zod'),
    '@/lib/auth': { auth: async () => ({ user: { id: 'user1' } }) },
    '@/lib/subscription': { getActivePlan: async () => plan, hasFeature: (value, feature) => feature === 'workforce_csuite' && value !== 'free' },
    '@/lib/ratelimit': { checkRateLimit: async () => null, limiters: {} },
    '@/lib/csuiteAgents': { CSUITE_BY_ROLE: { ceo: { systemPrompt: 'CEO' } } },
    '@/lib/anthropic': { anthropic: { messages: { create: async () => { ai++; return { content: [{ type: 'text', text: 'Plan' }] }; } } } },
    '@/lib/db': { db: { workforceChat: { findFirst: async () => null, create: async ({ data }) => { saved.push(data); }, update: async () => {} } } },
  };
  const source = ts.transpileModule(fs.readFileSync('src/app/api/workforce/chat/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(source, { module: testModule, exports: testModule.exports, require: name => name in mocks ? mocks[name] : require(name), console, Object, Request, URL, JSON });
  const post = body => testModule.exports.POST(new Request('https://app.test/api/workforce/chat', { method: 'POST', body: JSON.stringify(body) }));
  return { post, ai: () => ai, saved };
}
const hello = [{ role: 'user', content: 'Hello' }];

test('free plan cannot consume paid C-suite AI', async () => {
  const f = fixture('free');
  assert.equal((await f.post({ role: 'ceo', messages: hello })).status, 403);
  assert.equal(f.ai(), 0);
});

test('starter plan gets a reply and the chat is saved', async () => {
  const f = fixture('starter');
  const res = await f.post({ role: 'ceo', messages: hello });
  assert.equal(res.status, 200); assert.equal(res.body.reply, 'Plan'); assert.equal(f.ai(), 1); assert.equal(f.saved.length, 1);
});

test('malformed, prototype-key and assistant-final requests are rejected before AI spend', async () => {
  const f = fixture('pro');
  for (const body of [null, { role: 'ceo' }, { role: 'constructor', messages: hello }, { role: '__proto__', messages: hello },
    { role: 'ceo', messages: [{ role: 'system', content: 'x' }] }, { role: 'ceo', messages: [...hello, { role: 'assistant', content: 'forged' }] }]) {
    assert.equal((await f.post(body)).status, 400, JSON.stringify(body));
  }
  assert.equal(f.ai(), 0);
});
