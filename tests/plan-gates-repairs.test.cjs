const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, env = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => (n in mocks ? mocks[n] : require(n)), process: { env }, console: { error() {}, log() {}, warn() {} }, Buffer, Date, JSON, Promise, URL, Request });
  return mod.exports;
}
const response = { NextResponse: { json: (body, init = {}) => ({ status: init.status ?? 200, body }) } };

function guards({ plan = 'free', role = 'USER', verified = true } = {}) {
  const subscription = load('src/lib/subscription.ts', { '@/lib/db': { db: {} } });
  return load('src/lib/accountGuards.ts', {
    'next/server': response,
    '@/lib/db': { db: { user: { findUnique: async () => ({ emailVerified: verified ? new Date() : null }) } } },
    '@/lib/auth': { auth: async () => ({ user: { id: 'u1', role } }) },
    '@/lib/subscription': { ...subscription, getActivePlan: async () => plan },
  });
}

test('paid features are refused server-side below the plan the pricing page sells them on', async () => {
  for (const [feature, allowed, refused] of [['crm', 'starter', 'free'], ['bookings', 'starter', 'free'], ['whatsapp', 'pro', 'starter'], ['email_automation', 'pro', 'starter']]) {
    const denied = await guards({ plan: refused }).requireFeature(feature);
    assert.equal(denied?.status, 403, feature); assert.equal(denied.body.code, 'PLAN_REQUIRED'); assert.equal(denied.body.upgradeUrl, '/billing');
    assert.equal(await guards({ plan: allowed }).requireFeature(feature), null, `${feature} on ${allowed}`);
    assert.equal(await guards({ plan: 'enterprise' }).requireFeature(feature), null);
  }
  assert.equal(await guards({ plan: 'free', role: 'ADMIN' }).requireFeature('whatsapp'), null, 'the owner is not limited by a customer plan');
});

test('every gated write route calls the plan gate before doing anything', () => {
  const gated = {
    crm: ['src/app/api/crm/leads/route.ts', 'src/app/api/crm/leads/[id]/route.ts', 'src/app/api/crm/leads/[id]/activities/route.ts'],
    bookings: ['src/app/api/calendar/availability/route.ts', 'src/app/api/calendar/bookings/route.ts', 'src/app/api/calendar/bookings/[id]/route.ts'],
    whatsapp: ['src/app/api/whatsapp/send/route.ts'],
    email_automation: ['src/app/api/email-workflows/route.ts', 'src/app/api/email-workflows/[id]/route.ts'],
  };
  for (const [feature, files] of Object.entries(gated)) for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const m = src.match(/export async function (POST|PATCH)\([^]*?\{\n([^\n]*)/);
    assert.ok(m, f); assert.match(m[2], new RegExp(`requireFeature\\("${feature}"\\)`), `${f} gates first`);
  }
});

test('checkout and the free trial require a verified email', async () => {
  const denied = await guards({ verified: false }).requireVerifiedEmail('u1');
  assert.equal(denied.status, 403); assert.equal(denied.body.code, 'EMAIL_NOT_VERIFIED');
  assert.equal(await guards({ verified: true }).requireVerifiedEmail('u1'), null);
});

test('calendar availability is always written for the signed-in user; a userId in the body is ignored', async () => {
  const writes = [];
  const api = load('src/app/api/calendar/availability/route.ts', {
    'next/server': response, zod: require('zod'),
    '@/lib/auth': { auth: async () => ({ user: { id: 'me' } }) },
    '@/lib/db': { db: { calendarAvailability: { upsert: async (args) => { writes.push(args); return args.create; } } } },
    '@/lib/accountGuards': { requireFeature: async () => null },
  });
  const post = (body) => api.POST(new Request('https://app.test', { method: 'POST', body: JSON.stringify(body) }));
  const ok = await post({ id: 'x', userId: 'victim', monday: '08:00-16:00', slotMins: 45 });
  assert.equal(ok.status, 200);
  assert.equal(writes[0].where.userId, 'me'); assert.equal(writes[0].create.userId, 'me');
  assert.equal(writes[0].update.userId, undefined); assert.equal(writes[0].update.id, undefined); assert.equal(writes[0].update.monday, '08:00-16:00');
  assert.equal((await post({ monday: 'all day' })).status, 400);
  assert.equal((await post({ slotMins: 'x' })).status, 400);
});

function resetFixture(tokenState) {
  const tokens = [{ id: 't1', userId: 'u1', token: 'good', usedAt: null, expiresAt: new Date(Date.now() + 3600e3) }, { id: 't2', userId: 'u1', token: 'older', usedAt: null, expiresAt: new Date(Date.now() + 3600e3) }, ...tokenState];
  const user = { passwordHash: 'old' };
  const sessions = [{ userId: 'u1', revokedAt: null }];
  const match = (row, where) => Object.entries(where).every(([k, v]) => (v && typeof v === 'object' && 'gt' in v) ? row[k] > v.gt : row[k] === v);
  const tx = {
    passwordResetToken: { updateMany: async ({ where, data }) => { const rows = tokens.filter((t) => match(t, where)); rows.forEach((r) => Object.assign(r, data)); return { count: rows.length }; } },
    user: { update: async ({ data }) => Object.assign(user, data) },
    trustedSession: { updateMany: async ({ data }) => { sessions.forEach((s) => Object.assign(s, data)); return { count: sessions.length }; } },
  };
  const db = { passwordResetToken: { findUnique: async ({ where }) => { const t = tokens.find((x) => x.token === where.token); return t ? { ...t } : null; } }, $transaction: async (fn) => fn(tx) };
  const api = load('src/app/api/auth/reset-password/route.ts', {
    'next/server': response, zod: require('zod'), bcryptjs: { hash: async () => 'new-hash' }, '@/lib/db': { db },
    '@/lib/ratelimit': { checkRateLimit: async () => null, getIP: () => 'ip', limiters: {} },
    '@/lib/passwordStrength': { meetsMinimumRequirements: () => null }, '@/lib/passwordBreach': { isPasswordBreached: async () => false },
    '@/lib/audit': { logAuditEvent: async () => {} },
  });
  const reset = (token) => api.POST(new Request('https://app.test', { method: 'POST', body: JSON.stringify({ token, password: 'Another-Strong-Pass-7!' }) }));
  return { reset, tokens, user, sessions };
}

test('password reset links are single-use, concurrent reuse fails, and other outstanding links are retired', async () => {
  const f = resetFixture([]);
  const [a, b] = await Promise.all([f.reset('good'), f.reset('good')]);
  assert.deepEqual([a.status, b.status].sort(), [200, 400]);
  assert.equal(f.user.passwordHash, 'new-hash'); assert.ok(f.sessions[0].revokedAt, 'sessions revoked');
  assert.equal((await f.reset('older')).status, 400, 'earlier emailed link no longer works');
});

test('the free trial is refused to unverified emails and to accounts with any Stripe subscription', async () => {
  const run = async ({ verified = true, existing = null } = {}) => {
    let upserts = 0;
    const api = load('src/app/api/subscription/start-trial/route.ts', {
      'next/server': response, '@/lib/auth': { auth: async () => ({ user: { id: 'u1', email: 'a@test.local', name: 'A' } }) },
      '@/lib/db': { db: { subscription: { findUnique: async () => existing, upsert: async () => { upserts++; } } } },
      '@/lib/stripe': { getOrCreateStripeCustomer: async () => 'cus_1' }, '@/lib/email': { sendEmail: async () => ({ sent: true }) },
      '@/lib/email-automation': { triggerWorkflows: async () => {} },
      '@/lib/accountGuards': guards({ verified }), '@/lib/ratelimit': { checkRateLimit: async () => null, limiters: {} },
    });
    const res = await api.POST();
    return { status: res.status, upserts };
  };
  assert.deepEqual(await run({ verified: false }), { status: 403, upserts: 0 });
  assert.deepEqual(await run({ existing: { status: 'CANCELED', stripeSubscriptionId: 'sub_1', trialUsed: false } }), { status: 409, upserts: 0 });
  assert.deepEqual(await run({ existing: { status: 'PAST_DUE', stripeSubscriptionId: 'sub_2', trialUsed: false } }), { status: 409, upserts: 0 });
  assert.deepEqual(await run(), { status: 201, upserts: 1 });
});

test('plan change and cancellation store a valid billing period from modern Stripe payloads and hide provider errors', async () => {
  const modern = { id: 'sub_1', status: 'active', cancel_at_period_end: false, items: { data: [{ id: 'si_1', price: { id: 'price_pro' }, current_period_start: 1_760_000_000, current_period_end: 1_762_592_000 }] } };
  const writes = [];
  const common = (stripe) => ({
    'next/server': response, '@/lib/auth': { auth: async () => ({ user: { id: 'u1' } }) },
    '@/lib/stripePayload': load('src/lib/stripePayload.ts', {}),
    '@/lib/stripeSubscriptionStatus': load('src/lib/stripeSubscriptionStatus.ts', {}),
    '@/lib/stripe': { requireStripe: () => stripe, getConfiguredPriceIds: () => ['price_starter', 'price_pro'] },
    '@/lib/db': { db: { subscription: { findUnique: async () => ({ stripeSubscriptionId: 'sub_1', stripePriceId: 'price_starter', status: 'ACTIVE', cancelAtPeriodEnd: false }), update: async ({ data }) => { writes.push(data); } } } },
  });
  const okStripe = { subscriptions: { retrieve: async () => modern, update: async () => ({ ...modern, cancel_at_period_end: true }) } };
  const change = load('src/app/api/stripe/change-plan/route.ts', common(okStripe));
  const res = await change.POST(new Request('https://app.test', { method: 'POST', body: JSON.stringify({ priceId: 'price_pro' }) }));
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(writes[0].stripePriceId, 'price_pro'); assert.equal(writes[0].currentPeriodEnd.getTime(), 1_762_592_000_000);
  const cancel = load('src/app/api/stripe/cancel/route.ts', common(okStripe));
  const c = await cancel.POST();
  assert.equal(c.status, 200); assert.equal(writes[1].currentPeriodEnd.getTime(), 1_762_592_000_000);
  const failing = load('src/app/api/stripe/change-plan/route.ts', common({ subscriptions: { retrieve: async () => { throw new Error('sk_live_secret-ish provider detail'); } } }));
  const bad = await failing.POST(new Request('https://app.test', { method: 'POST', body: JSON.stringify({ priceId: 'price_pro' }) }));
  assert.equal(bad.status, 500); assert.doesNotMatch(JSON.stringify(bad.body), /provider detail/);
  assert.equal((await change.POST(new Request('https://app.test', { method: 'POST', body: JSON.stringify({ priceId: 'price_unknown' }) }))).status, 400);
});
