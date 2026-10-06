const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name), process: { env: { NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://app.test' } }, console: { error() {}, log() {} }, Date });
  return module.exports;
}
const next = { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } };
test('signup normalizes email and completes independent after-response tasks despite one failure', async () => {
  const callbacks = []; const tasks = []; let created;
  const api = load('src/app/api/auth/register/route.ts', {
    'next/server': { ...next, after: callback => callbacks.push(callback) },
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'affiliate' }) }) },
    bcryptjs: { hash: async () => 'hash' },
    '@/lib/db': { db: { user: { findFirst: async () => null, create: async ({ data }) => { created = data; return { ...data, id: 'user' }; } } } },
    '@/lib/ratelimit': { checkRateLimit: async () => null, getIP: () => 'ip', limiters: {} },
    '@/lib/referrals': { recordReferralSignup: async () => { tasks.push('referral'); throw new Error('Unavailable'); }, recordAffiliateSignup: async () => { tasks.push('affiliate'); } },
    '@/lib/email': { createAndSendVerificationEmail: async () => { tasks.push('verify'); }, sendWelcomeEmail: async () => { tasks.push('welcome'); } },
    '@/lib/passwordStrength': { meetsMinimumRequirements: () => null }, '@/lib/passwordBreach': { isPasswordBreached: async () => false },
  });
  const result = await api.POST(new Request('https://app.test/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Visitor', email: '  Buyer@Example.com  ', password: 'StrongPassword42!' }) }));
  assert.equal(result.status, 201); assert.equal(created.email, 'buyer@example.com'); assert.equal(tasks.length, 0);
  await callbacks[0](); assert.deepEqual(tasks.sort(), ['affiliate', 'referral', 'verify', 'welcome']);
});
function checkoutFixture({ local = null, remote = [], open = [], expireFails = false } = {}) {
  let created = 0; const expired = []; let idempotency;
  const api = load('src/app/api/stripe/create-checkout/route.ts', {
    'next/server': next, 'next/headers': { cookies: async () => ({ get: () => null }) },
    '@/lib/auth': { auth: async () => ({ user: { id: 'user', email: 'buyer@example.com' } }) },
    '@/lib/ratelimit': { checkRateLimit: async () => null, limiters: {} },
    '@/lib/db': { db: { subscription: { findUnique: async () => local } } },
    '@/lib/stripe': { requireStripe: () => ({ subscriptions: { list: async () => ({ data: remote }) }, checkout: { sessions: { list: async () => ({ data: open }), expire: async (id) => { if (expireFails) throw new Error("Provider could not expire checkout"); expired.push(id); }, create: async (_body, options) => { idempotency = options.idempotencyKey; created++; return { url: 'https://checkout.stripe.test/session' }; } } } }), getOrCreateStripeCustomer: async () => 'cus_test', findPlanByPriceId: () => ({ id: 'starter', annualPriceId: '' }) },
  });
  return { async post(priceId = 'price_test') { return api.POST(new Request('https://app.test/api/stripe/create-checkout', { method: 'POST', body: JSON.stringify({ priceId }) })); }, created: () => created, expired: () => expired, idempotency: () => idempotency };
}
test('checkout rejects existing local and webhook-lagged Stripe subscriptions', async () => {
  for (const config of [ { local: { stripeSubscriptionId: 'sub_test', status: 'ACTIVE' } }, { remote: [{ status: 'active' }] }, { remote: [{ status: 'trialing' }] }, { remote: [{ status: 'past_due' }] } ]) {
    const f = checkoutFixture(config); assert.equal((await f.post()).status, 409); assert.equal(f.created(), 0);
  }
});
test('checkout allows canceled histories and handles invalid request types', async () => {
  const f = checkoutFixture({ remote: [{ status: 'canceled' }, { status: 'incomplete_expired' }] });
  assert.equal((await f.post()).status, 200); assert.equal(f.created(), 1);
  assert.equal((await f.post(123)).status, 400); assert.equal(f.created(), 1);
});

test('checkout reuses matching session and expires conflicting customer session before replacement', async () => {
  const same = checkoutFixture({ open: [{ id: 'cs_matching', mode: 'subscription', metadata: { planId: 'starter', billingInterval: 'monthly' }, url: 'https://checkout.stripe.test/existing' }] });
  assert.equal((await same.post()).body.url, 'https://checkout.stripe.test/existing'); assert.equal(same.created(), 0);
  const other = checkoutFixture({ open: [{ id: 'cs_conflicting', mode: 'subscription', metadata: { planId: 'professional', billingInterval: 'monthly' } }] });
  assert.equal((await other.post()).status, 200); assert.equal(other.created(), 1); assert.deepEqual(other.expired(), ['cs_conflicting']);
});

test('checkout expiration failure prevents replacement; unrelated one-off sessions remain open', async () => {
  const f = checkoutFixture({ expireFails: true, open: [{ id: 'cs_existing', mode: 'subscription', metadata: { planId: 'professional' } }] });
  assert.equal((await f.post()).status, 500); assert.equal(f.created(), 0);
  const oneOff = checkoutFixture({ open: [{ id: 'cs_payment', mode: 'payment' }] });
  assert.equal((await oneOff.post()).status, 200); assert.deepEqual(oneOff.expired(), []);
});

test('switching back to a previously expired plan does not reuse its stale idempotency key', async () => {
  const first = checkoutFixture(); await first.post();
  const returning = checkoutFixture({ open: [{ id: 'cs_other_plan', mode: 'subscription', metadata: { planId: 'professional' } }] }); await returning.post();
  assert.notEqual(first.idempotency(), returning.idempotency());
});
