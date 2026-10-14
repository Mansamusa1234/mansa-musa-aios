const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('middleware reads the session cookie under the same name Auth.js set it (secure only over HTTPS)', async () => {
  const seen = [];
  const source = ts.transpileModule(fs.readFileSync('src/middleware.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  const NextResponse = { next: () => ({ kind: 'next' }), redirect: (u) => ({ kind: 'redirect', to: String(u) }) };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => (n === 'next/server' ? { NextResponse } : n === 'next-auth/jwt' ? { getToken: async (o) => { seen.push(o.secureCookie); return { role: 'USER' }; } } : require(n)), process: { env: { NEXTAUTH_SECRET: 's', NODE_ENV: 'production' } }, URL });
  const req = (url) => ({ url, nextUrl: new URL(url) });
  assert.equal((await mod.exports.middleware(req('https://www.mansamusainitiative.com/dashboard'))).kind, 'next');
  await mod.exports.middleware(req('http://localhost:3000/dashboard'));
  assert.deepEqual(seen, [true, false]);
  assert.equal((await mod.exports.middleware(req('https://www.mansamusainitiative.com/admin'))).kind, 'redirect', 'non-admins are kept out of /admin');
});

test('no fake countdown; the launch promotion only appears when its Stripe code is configured', () => {
  const src = fs.readFileSync('src/components/marketing/PromoBanner.tsx', 'utf8');
  assert.doesNotMatch(src, /setInterval|mm_offer_end|expiresHours/);
  assert.match(src, /NEXT_PUBLIC_LAUNCH_PROMO_CODE/);
  assert.match(src, /if \(!promoCode\) return null;/);
  assert.doesNotMatch(src, /"LAUNCH20"/);
});

test('customer-facing copy does not promise automatic social posting', () => {
  assert.doesNotMatch(fs.readFileSync('src/components/onboarding/OnboardingAgent.tsx', 'utf8'), /social media that posts daily/);
});

test('billing treats only a live Stripe subscription as the current plan', () => {
  const src = fs.readFileSync('src/app/(dashboard)/billing/page.tsx', 'utf8');
  assert.match(src, /\["ACTIVE", "TRIALING", "PAST_DUE"\]\.includes\(subscription\.status\)/);
  assert.match(src, /currentPriceId=\{liveSubscription\?\.stripePriceId \?\? null\}/);
  assert.match(fs.readFileSync('src/app/(dashboard)/billing/BillingClient.tsx', 'utf8'), /: !currentPriceId && !onTrial;/);
});

function loadTsx(file, mocks, env = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => (n in mocks ? mocks[n] : require(n)), process: { env } });
  return mod.exports;
}

test('the approval button says what approving will actually do', () => {
  const { approveLabel } = loadTsx('src/components/admin/ApprovalQueueClient.tsx', {});
  assert.equal(approveLabel('manual', []), 'Approve for manual publication');
  assert.equal(approveLabel('direct', ['instagram', 'facebook']), 'Approve and publish now to instagram, facebook');
  assert.equal(approveLabel('direct', []), 'Approve (no network is enabled for live posting)');
  assert.equal(approveLabel('metricool-draft', []), 'Approve and save as Metricool drafts');
});

test('the approval page derives the mode and live networks from the same settings the approval route uses', async () => {
  const render = async (env) => {
    const page = loadTsx('src/app/admin/approval-queue/page.tsx', {
      '@/components/admin/ApprovalQueueClient': { __esModule: true, default: (props) => props },
      '@/lib/metricool': { isMetricoolConfigured: () => !!env.METRICOOL, metricoolDraftMode: () => true, SOCIAL_NETWORKS: ['facebook', 'instagram', 'tiktok', 'youtube'] },
      '@/lib/socialPublisher': { directPublishEnabled: () => env.SOCIAL_DIRECT_PUBLISH === 'true', networkEnabled: (n) => (env.SOCIAL_PUBLISH_NETWORKS ?? '').split(',').includes(n), networkConfigured: async (n) => n !== 'tiktok' },
    }, env);
    return (await page.default()).props;
  };
  assert.deepEqual({ ...(await render({})) , liveNetworks: [...(await render({})).liveNetworks] }, { socialMode: 'manual', liveNetworks: [] });
  const direct = await render({ SOCIAL_DIRECT_PUBLISH: 'true', SOCIAL_PUBLISH_NETWORKS: 'instagram,tiktok' });
  assert.equal(direct.socialMode, 'direct'); assert.deepEqual([...direct.liveNetworks], ['instagram'], 'enabled AND connected only');
  assert.equal((await render({ METRICOOL: true, SOCIAL_DIRECT_PUBLISH: 'true' })).socialMode, 'metricool-draft', 'Metricool takes precedence, as in the route');
});
