/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness loads isolated TypeScript modules */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, environment = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(source, { module: testModule, exports: testModule.exports, require: name => name in mocks ? mocks[name] : require(name), process: { env: environment }, console, Date, Request, AbortSignal, fetch, ReadableStream, TextEncoder, TextDecoder });
  return testModule.exports;
}
const response = { NextResponse: { json: (body, options = {}) => ({ status: options.status ?? 200, body }) } };
function queueFixture({ role = 'ADMIN', sent = true, type = 'email', metadata = '{"toEmail":"customer@example.com"}' } = {}) {
  const item = { id: 'draft1', type, platform: 'twitter', title: 'Draft', content: '<script>bad</script>', metadata, status: 'PENDING', updatedAt: new Date() };
  let calls = 0; let html = ''; let key;
  const db = { contentQueue: { findUnique: async () => ({ ...item }), updateMany: async ({ where, data }) => {
    if (where.status !== item.status || where.updatedAt !== item.updatedAt) return { count: 0 };
    Object.assign(item, data); return { count: 1 };
  }, update: async ({ data }) => Object.assign(item, data) } };
  const api = load('src/app/api/content-queue/[id]/route.ts', { 'next/server': response, '@/lib/auth': { auth: async () => role ? { user: { id: 'admin', role } } : null }, '@/lib/db': { db }, '@/lib/email': { sendEmail: async (_to, _subject, body, _from, idempotencyKey) => { calls++; html = body; key = idempotencyKey; return { sent, reason: 'Provider rejected' }; } } });
  return { item, send: () => api.PATCH(new Request('https://app.test/api/content-queue/draft1', { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }), { params: Promise.resolve({ id: 'draft1' }) }), info: () => ({ calls, html, key }) };
}
test('queue requires authenticated admin', async () => {
  assert.equal((await queueFixture({ role: null }).send()).status, 401);
  assert.equal((await queueFixture({ role: 'USER' }).send()).status, 403);
});
test('email approval marks sent only after success and escapes HTML', async () => {
  const f = queueFixture(); assert.equal((await f.send()).body.status, 'SENT');
  assert.equal(f.info().calls, 1); assert.match(f.info().html, /&lt;script&gt;/); assert.equal(f.info().key, 'queue-draft1');
});
test('email rejection leaves draft pending', async () => {
  const f = queueFixture({ sent: false }); assert.equal((await f.send()).status, 502); assert.equal(f.item.status, 'PENDING'); assert.equal(f.item.sentAt, undefined);
});
test('simultaneous approvals cannot send twice', async () => {
  const f = queueFixture(); const results = await Promise.all([f.send(), f.send()]); assert.equal(f.info().calls, 1); assert.ok(results.some(result => result.status === 409));
});
test('social approval does not falsely claim publication', async () => {
  const f = queueFixture({ type: 'social_post', metadata: null }); assert.equal((await f.send()).body.status, 'APPROVED'); assert.equal(f.info().calls, 0); assert.equal(f.item.sentAt, undefined);
});
test('malformed metadata and missing email recipient cannot approve', async () => {
  for (const metadata of ['{bad', '{}']) { const f = queueFixture({ metadata }); assert.equal((await f.send()).status, 400); assert.equal(f.item.status, 'PENDING'); assert.equal(f.info().calls, 0); }
});
test('Resend error response is reported as unsent', async () => {
  const { sendEmail } = load('src/lib/email.ts', { resend: { Resend: class { emails = { send: async () => ({ data: null, error: { name: 'validation_error' } }) } } }, '@/lib/db': { db: {} }, crypto: require('node:crypto') }, { RESEND_API_KEY: 'test-key' });
  assert.equal((await sendEmail('test@example.com', 'Test', 'Test')).sent, false);
});
test('Vercel KV credentials enable Redis limiters', () => {
  let supplied;
  const exports = load('src/lib/ratelimit.ts', { '@upstash/redis': { Redis: class { constructor(config) { supplied = config; } } }, '@upstash/ratelimit': { Ratelimit: class { static slidingWindow() {} } }, 'next/server': response }, { KV_REST_API_URL: 'https://redis.example.com', KV_REST_API_TOKEN: 'write-token', KV_REST_API_READ_ONLY_TOKEN: 'read-token' });
  assert.equal(supplied.token, 'write-token'); assert.ok(exports.limiters.chat);
});

test('subscription recognises annual prices, live card-free trials, and expiry', () => {
  const { resolveSubscriptionPlan: plan } = load('src/lib/subscription.ts', { '@/lib/db': { db: {} } }, { STRIPE_PRICE_PROFESSIONAL_ANNUAL: 'annual-pro', STRIPE_PRICE_STARTER: 'starter' });
  assert.equal(plan({ status: 'ACTIVE', stripePriceId: 'annual-pro' }), 'pro');
  assert.equal(plan({ status: 'TRIALING', stripePriceId: null, trialEndsAt: new Date(Date.now() + 86400000) }), 'pro');
  assert.equal(plan({ status: 'TRIALING', stripePriceId: null, trialEndsAt: new Date(0) }), 'free');
  assert.equal(plan({ status: 'PAST_DUE', stripePriceId: 'annual-pro' }), 'free');
});

function routerFixture(env = {}) {
  const failed = class { messages = { stream: async () => { throw new Error('Provider rejected'); } }; };
  return load('src/lib/modelRouter.ts', { '@anthropic-ai/sdk': failed, openai: class {}, '@google/generative-ai': { GoogleGenerativeAI: class {} }, '@mistralai/mistralai': { Mistral: class {} } }, env);
}
test('auto routing uses configured eligible providers and fails when none exist', () => {
  assert.throws(() => routerFixture().getAutoModel('free'), /No configured/);
  const router = routerFixture({ OPENAI_API_KEY: 'test' });
  const model = router.getAutoModel('free'); assert.equal(model.provider, 'openai'); assert.equal(model.planGate, 'free');
  assert.equal(router.planRank('starter'), router.planRank('basic')); assert.equal(router.planRank('professional'), router.planRank('pro'));
});
test('provider failure rejects both the stream and completion instead of hanging', async () => {
  const router = routerFixture({ ANTHROPIC_API_KEY: 'test' });
  const result = router.routeMessage(router.getAutoModel('free'), [{ role: 'user', content: 'hello' }], 'test');
  await assert.rejects(result.stream.getReader().read(), /Provider rejected/);
  await assert.rejects(result.onComplete, /Provider rejected/);
});
function webhookFixture(type, providerStatus, previousId = null) {
  const writes = []; const tasks = []; let converted = 0;
  const sub = { id: 'sub1', status: providerStatus, items: { data: [{ price: { id: 'price_test' } }] }, current_period_start: 1, current_period_end: 2 };
  const object = type === 'checkout.session.completed' ? { mode: 'subscription', subscription: 'sub1', customer: 'customer1', metadata: { userId: 'user1' } } : type.startsWith('invoice.') ? { subscription: 'sub1', customer: 'customer1', id: 'invoice1' } : sub;
  const db = { subscription: { findUnique: async () => previousId ? { stripeSubscriptionId: previousId } : null, findFirst: async () => null, upsert: async args => { writes.push(args.create); }, updateMany: async args => { writes.push(args.data); } } };
  const stripe = { webhooks: { constructEvent: () => ({ id: 'evt1', type, data: { object } }) }, subscriptions: { retrieve: async () => sub } };
  const api = load('src/app/api/stripe/webhook/route.ts', { 'next/server': { ...response, after: fn => tasks.push(fn) }, '@/lib/stripe': { getStripe: () => stripe, findPlanByPriceId: () => null }, '@/lib/db': { db }, '@/lib/referrals': { recordConversion: async () => { converted++; } }, '@/lib/email-automation': { triggerWorkflows: async () => {} }, '@/lib/email': { sendEmail: async () => ({ sent: true }) }, '@/lib/stripeSubscriptionStatus': load('src/lib/stripeSubscriptionStatus.ts', {}) }, { STRIPE_WEBHOOK_SECRET: 'test' });
  return { run: () => api.POST(new Request('https://app.test/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 'test' }, body: '{}' })), writes, tasks, conversions: () => converted };
}
test('Stripe checkout does not activate incomplete payments or trigger activation', async () => {
  const f = webhookFixture('checkout.session.completed', 'incomplete'); await f.run(); assert.equal(f.writes[0].status, 'INACTIVE'); assert.equal(f.tasks.length, 0); assert.equal(f.conversions(), 0);
});
test('invoice events preserve actual Stripe status, including failed-payment recovery', async () => {
  for (const [type, status, expected] of [['invoice.payment_succeeded', 'trialing', 'TRIALING'], ['invoice.payment_failed', 'past_due', 'PAST_DUE'], ['invoice.payment_failed', 'active', 'ACTIVE']]) {
    const f = webhookFixture(type, status); await f.run(); assert.equal(f.writes[0].status, expected);
    if (status === 'active') assert.equal(f.tasks.length, 0);
  }
});
test('repeated checkout completion does not repeat activation workflow', async () => {
  const f = webhookFixture('checkout.session.completed', 'active', 'sub1'); await f.run(); assert.equal(f.tasks.length, 0); assert.equal(f.writes[0].status, 'ACTIVE');
});
