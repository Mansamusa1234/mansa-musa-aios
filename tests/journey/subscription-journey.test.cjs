// End-to-end subscription journey against real modules, a real Postgres and
// the real Stripe SDK talking to stripe-mock. No real money, no real Stripe.
// Requires: `npm run journey:up` (Docker). Run with `npm run test:journey`.
const { test, before, after: afterAll } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const RealStripe = require('stripe');

const MOCK_PRICE = 'price_1PgafmB7WZ01zgkW6dKueIc5'; // stripe-mock fixture price
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: process.env.JOURNEY_DATABASE_URL || 'postgresql://postgres:localtest@127.0.0.1:55432/mansa_journey',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_local_journey',
  STRIPE_PRICE_STARTER: MOCK_PRICE,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
});

// Real Stripe SDK, pointed at stripe-mock.
// stripe-mock's fixture item period ends before it starts; give it a realistic 30-day period.
class LocalStripe extends RealStripe {
  constructor(key, options = {}) {
    super(key, { ...options, host: '127.0.0.1', port: 12111, protocol: 'http' });
    const retrieve = this.subscriptions.retrieve.bind(this.subscriptions);
    this.subscriptions.retrieve = async (...args) => {
      const sub = await retrieve(...args);
      const start = Math.floor(Date.now() / 1000);
      for (const item of sub.items.data) Object.assign(item, { current_period_start: start, current_period_end: start + 30 * 86400 });
      return sub;
    };
  }
}

// Mocked below; set so the real aiText helper selects the (mocked) Anthropic client.
process.env.ANTHROPIC_API_KEY ??= 'test-only-not-a-key';
let sessionUser = null; let aiCalls = 0; const afterTasks = [];
const shared = {
  stripe: LocalStripe,
  'next/headers': { cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() },
  '@/lib/auth': { auth: async () => (sessionUser ? { user: sessionUser } : null) },
  '@/lib/email': new Proxy({}, { get: (_, key) => key === '__esModule' ? false : async () => ({ sent: true }) }),
  '@/lib/email-automation': { triggerWorkflows: async () => {} },
  '@/lib/passwordBreach': { isPasswordBreached: async () => false },
  '@/lib/anthropic': { anthropic: { messages: { create: async () => { aiCalls++; return { content: [{ type: 'text', text: 'Executive plan ready' }] }; } } } },
};
const realNext = require('next/server');
shared['next/server'] = { ...realNext, NextResponse: realNext.NextResponse, after: (fn) => afterTasks.push(fn) };

const cache = new Map();
function resolveAlias(spec) {
  const base = path.join(__dirname, '..', '..', 'src', spec.slice(2));
  for (const ext of ['.ts', '.tsx', '/index.ts']) if (fs.existsSync(base + ext)) return base + ext;
  throw new Error('Cannot resolve ' + spec);
}
function resolveRelative(dir, spec) {
  const base = path.resolve(dir, spec);
  for (const ext of ['.ts', '.tsx', '/index.ts']) if (fs.existsSync(base + ext)) return base + ext;
  throw new Error('Cannot resolve ' + spec);
}
function load(file) {
  const abs = path.resolve(file);
  if (cache.has(abs)) return cache.get(abs).exports;
  const output = ts.transpileModule(fs.readFileSync(abs, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} }; cache.set(abs, mod);
  const req = (name) => name in shared ? shared[name]
    : name.startsWith('@/') ? load(resolveAlias(name))
    : name.startsWith('.') ? load(resolveRelative(path.dirname(abs), name))
    : require(name);
  vm.runInThisContext(`(function (module, exports, require) {${output}\n})`)(mod, mod.exports, req);
  return mod.exports;
}

const { db } = load('src/lib/db.ts');
const { getActivePlan } = load('src/lib/subscription.ts');
const register = load('src/app/api/auth/register/route.ts');
const checkout = load('src/app/api/stripe/create-checkout/route.ts');
const webhook = load('src/app/api/stripe/webhook/route.ts');
const workforce = load('src/app/api/workforce/chat/route.ts');
const signer = new RealStripe('sk_test_123');
const email = `journey+${Date.now()}@example.test`;

function signedWebhook(event, { tamper = false } = {}) {
  const payload = JSON.stringify(event);
  const signature = signer.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  return webhook.POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body: tamper ? payload.replace('paid', 'unpaid') : payload }));
}
const askCeo = () => workforce.POST(new Request('http://localhost/api/workforce/chat', { method: 'POST', body: JSON.stringify({ role: 'ceo', messages: [{ role: 'user', content: 'Plan my week' }] }) }));

before(async () => { await db.$queryRaw`SELECT 1`; });
afterAll(async () => {
  const user = await db.user.findUnique({ where: { email } });
  if (user) { await db.subscription.deleteMany({ where: { userId: user.id } }); await db.workforceChat.deleteMany({ where: { userId: user.id } }); await db.user.delete({ where: { id: user.id } }).catch(() => {}); }
  await db.$disconnect();
});

let userId; let customerId; let subscriptionId;

test('1. signup creates a Free account', async () => {
  const res = await register.POST(new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Journey Test', email, password: 'Correct-Horse-Battery-9!' }) }));
  assert.equal(res.status, 201, JSON.stringify(await res.clone().json()));
  const user = await db.user.findUnique({ where: { email } });
  assert.ok(user); userId = user.id; sessionUser = { id: user.id, email };
  assert.equal(await getActivePlan(userId), 'free');
});

test('2. Free account cannot use the paid AI executive team', async () => {
  const res = await askCeo();
  assert.equal(res.status, 403); assert.equal(aiCalls, 0);
});

test('3. checkout creates a Stripe customer and subscription checkout session', async () => {
  // stripe-mock is stateless and returns fixture objects for every list call; a brand-new
  // customer has no prior subscriptions or open checkouts, so model that explicitly.
  const proto = Object.getPrototypeOf(new LocalStripe('sk_test_123').subscriptions);
  const origSubList = proto.list; proto.list = async () => ({ data: [] });
  const sessProto = Object.getPrototypeOf(new LocalStripe('sk_test_123').checkout.sessions);
  const origSessList = sessProto.list; sessProto.list = async () => ({ data: [] });
  try {
    const res = await checkout.POST(new Request('http://localhost/api/stripe/create-checkout', { method: 'POST', body: JSON.stringify({ priceId: MOCK_PRICE }) }));
    const body = await res.json();
    assert.equal(res.status, 200, JSON.stringify(body));
    assert.match(body.url, /^https:\/\/checkout\.stripe\.com\//);
  } finally { proto.list = origSubList; sessProto.list = origSessList; }
  const user = await db.user.findUnique({ where: { id: userId } });
  customerId = user.stripeCustomerId ?? (await db.subscription.findUnique({ where: { userId } }))?.stripeCustomerId;
  assert.match(customerId, /^cus_/);
});

test('4. tampered webhook is rejected before any write', async () => {
  const res = await signedWebhook({ id: 'evt_tamper', type: 'checkout.session.completed', data: { object: { id: 'cs_test', mode: 'subscription', subscription: 'sub_journey', customer: customerId, payment_status: 'paid', metadata: { userId } } } }, { tamper: true });
  assert.equal(res.status, 400);
  assert.equal(await db.subscription.count({ where: { userId, status: 'ACTIVE' } }), 0);
});

test('5. signed checkout.session.completed fulfils the subscription (modern Stripe shape)', async () => {
  subscriptionId = 'sub_journey';
  const res = await signedWebhook({ id: 'evt_paid', type: 'checkout.session.completed', data: { object: { id: 'cs_test', mode: 'subscription', subscription: subscriptionId, customer: customerId, payment_status: 'paid', metadata: { userId } } } });
  assert.equal(res.status, 200);
  const row = await db.subscription.findUnique({ where: { userId } });
  assert.equal(row.status, 'ACTIVE'); assert.equal(row.stripePriceId, MOCK_PRICE);
  assert.ok(row.currentPeriodEnd instanceof Date && !Number.isNaN(row.currentPeriodEnd.getTime()), 'valid billing period stored');
  subscriptionId = row.stripeSubscriptionId;
  assert.equal(await getActivePlan(userId), 'starter');
});

test('6. paid Starter account uses the AI executive team', async () => {
  const res = await askCeo(); const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body)); assert.equal(body.reply, 'Executive plan ready'); assert.equal(aiCalls, 1);
  assert.equal(await db.workforceChat.count({ where: { userId } }), 1);
});

test('7. cancellation webhook (modern shape) revokes paid access', async () => {
  const live = await new LocalStripe('sk_test_123').subscriptions.retrieve(subscriptionId);
  const res = await signedWebhook({ id: 'evt_cancel', type: 'customer.subscription.deleted', data: { object: { ...live, id: subscriptionId, status: 'canceled' } } });
  assert.equal(res.status, 200);
  assert.equal((await db.subscription.findUnique({ where: { userId } })).status, 'CANCELED');
  assert.equal(await getActivePlan(userId), 'free');
  assert.equal((await askCeo()).status, 403); assert.equal(aiCalls, 1);
});
