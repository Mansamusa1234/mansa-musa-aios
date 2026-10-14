// Customer-facing copy must describe only working features. Production has no Twilio, so phone answering,
// SMS and WhatsApp are not offered; SSO/SAML is not implemented; each account has one website chat receptionist.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const COPY_FILES = [
  'src/lib/stripe.ts', 'src/app/pricing/PricingContent.tsx', 'src/components/landing/LandingPage.tsx',
  'src/components/onboarding/OnboardingAgent.tsx', 'src/app/onboarding/OnboardingClient.tsx',
  'src/app/ai-receptionist/ReceptionistContent.tsx', 'src/app/ai-receptionist/page.tsx',
  'src/app/enterprise/EnterpriseContent.tsx', 'src/app/enterprise/page.tsx', 'src/app/press/page.tsx',
  'src/components/marketing/SocialProof.tsx', 'src/components/marketing/ROICalculator.tsx', 'src/app/grow/page.tsx',
  'src/app/api/cron/trial-upsell/route.ts', 'src/app/api/cron/plan-upsell/route.ts', 'src/app/api/cron/win-back/route.ts',
  'src/app/api/cron/activation-nudge/route.ts', 'src/app/api/cron/medium-post/route.ts', 'src/app/api/cron/substack-post/route.ts',
  'src/app/api/cron/affiliate-recruit/route.ts', 'src/app/(dashboard)/workforce/WorkforceContent.tsx',
];
// A sentence that says a channel is NOT offered (or tells an AI not to mention it) is allowed.
const DISCLAIMER = /not (currently )?offered|do not mention|are not offered/i;
const BANNED = /whatsapp|\bSMS\b|phone (call|answering)|answers? (every )?calls?|calls? \/ ?month|unlimited calls|missed calls?|connect your (phone )?number|\bSSO\b|SAML|single sign-on|3 AI receptionists|unlimited AI receptionists|white-label|2,400\+|£12M|98\.7%|4\.9★|1,000\+ businesses|thousands of (founders|users)/i;

test('customer-facing copy makes no phone, SMS, WhatsApp, SSO or invented social-proof claims', () => {
  for (const file of COPY_FILES) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (BANNED.test(line) && !DISCLAIMER.test(line) && !/^\s*\/\//.test(line)) assert.fail(`${file}:${i + 1}: ${line.trim().slice(0, 140)}`);
    });
  }
});

test('published blog articles make no unsupported channel claims; withdrawn articles are not served', () => {
  const m = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/data/blog.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: m, exports: m.exports, Set });
  const slugs = m.exports.posts.map((p) => p.slug);
  for (const gone of ['whatsapp-business-ai-automation', 'ai-for-restaurants-uk', 'ai-for-estate-agents-uk', 'ai-for-dental-practices-uk']) assert.ok(!slugs.includes(gone), gone);
  for (const p of m.exports.posts) {
    const text = [p.title, p.subtitle, p.excerpt, p.tags.join(' '), p.content].join('\n');
    for (const line of text.split('\n')) if (BANNED.test(line) && !DISCLAIMER.test(line)) assert.fail(`${p.slug}: ${line.slice(0, 140)}`);
  }
});

test('plans list only working features and keep the live prices', () => {
  const stripe = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/stripe.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText,
    { module: stripe, exports: stripe.exports, require: (n) => (n === 'stripe' ? class {} : n === '@/lib/stripePrices' ? { priceEnv: () => '' } : require(n)), process: { env: {} }, URL });
  const byId = Object.fromEntries(stripe.exports.PLANS.map((p) => [p.id, p]));
  assert.deepEqual([byId.free.price, byId.starter.price, byId.professional.price, byId.enterprise.price], [0, 49, 149, 499]);
  for (const p of stripe.exports.PLANS) for (const f of p.features) assert.doesNotMatch(f, BANNED, `${p.id}: ${f}`);
  assert.ok(byId.starter.features.includes('Website chat AI receptionist'));
});

test('Medium and Substack crons only create drafts (no unapproved publishing or newsletter send)', () => {
  const medium = fs.readFileSync('src/app/api/cron/medium-post/route.ts', 'utf8');
  assert.match(medium, /publishStatus: "draft"/); assert.doesNotMatch(medium, /publishStatus: "public"/);
  const substack = fs.readFileSync('src/app/api/cron/substack-post/route.ts', 'utf8');
  assert.doesNotMatch(substack, /\/publish`/);
});
