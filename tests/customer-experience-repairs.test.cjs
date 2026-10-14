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
