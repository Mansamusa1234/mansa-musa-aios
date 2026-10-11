/* eslint-disable @typescript-eslint/no-require-imports -- Isolated route regression tests */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function fixture(plan) {
  const tasks = []; let ai = 0; let sent = 0;
  const next = { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) }, after: callback => tasks.push(callback) };
  const mocks = {
    'next/server': next,
    '@/lib/subscription': { getActivePlan: async () => plan, hasFeature: value => value !== 'free' },
    '@/lib/ratelimit': { checkRateLimit: async () => null, getIP: () => 'ip', limiters: {} },
    '@/lib/db': { db: {
      receptionist: { findUnique: async () => ({ id: 'rec', userId: 'owner', isActive: true }), update: async () => {} },
      receptionistChat: { create: async () => {} }, lead: { findFirst: async () => null, create: async () => {} },
      user: { findUnique: async () => ({ email: 'owner@example.com' }) },
    } },
    '@/lib/anthropic': { anthropic: { messages: { create: async () => { ai++; return { content: [{ type: 'text', text: 'Hello' }] }; } } } },
    '@/lib/email': { sendEmail: async () => { await Promise.resolve(); sent++; }, newLeadEmailHtml: () => '' },
  };
  const source = ts.transpileModule(fs.readFileSync('src/app/api/receptionist/chat/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(source, { module: testModule, exports: testModule.exports, require: name => mocks[name] ?? require(name), console });
  return { tasks, ai: () => ai, sent: () => sent, run: () => testModule.exports.POST(new Request('https://app.test/api/receptionist/chat', { method: 'POST', body: JSON.stringify({ receptionistId: 'rec', messages: [{ role: 'user', content: 'Hello' }], visitorName: 'Visitor', visitorEmail: 'visitor@example.com' }) })) };
}
test('free or expired owners cannot consume paid receptionist AI', async () => {
  const f = fixture('free'); assert.equal((await f.run()).status, 403); assert.equal(f.ai(), 0); assert.equal(f.tasks.length, 0);
});
test('paid receptionist replies and keeps lead email alive after response', async () => {
  const f = fixture('starter'); assert.equal((await f.run()).status, 200); assert.equal(f.ai(), 1); assert.equal(f.sent(), 0);
  assert.equal(f.tasks.length, 1); await f.tasks[0](); assert.equal(f.sent(), 1);
});
