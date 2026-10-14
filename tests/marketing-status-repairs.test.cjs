const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(env, routes) {
  const source = ts.transpileModule(fs.readFileSync('src/lib/marketingStatus.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  const fetch = async (url) => {
    const hit = Object.entries(routes).find(([k]) => String(url).includes(k));
    if (!hit) throw new Error('unexpected ' + url);
    const [status, body] = hit[1];
    return { status, json: async () => body };
  };
  const mocks = {
    '@/lib/db': { db: { account: { findUnique: async () => null } } },
    '@/lib/metricool': { isMetricoolConfigured: () => false },
    '@/lib/socialPublisher': {
      directPublishEnabled: () => env.SOCIAL_DIRECT_PUBLISH === 'true',
      networkEnabled: (n) => (env.SOCIAL_PUBLISH_NETWORKS ?? '').split(',').includes(n),
    },
    '@/lib/social-automation': { youtubeRefreshToken: async () => env.YOUTUBE_REFRESH_TOKEN ?? null },
  };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => mocks[n] ?? require(n), process: { env }, fetch, AbortSignal, URLSearchParams, Promise, String, Boolean, JSON, encodeURIComponent });
  return mod.exports;
}

const SECRETS = { INSTAGRAM_USER_ID: '1789', INSTAGRAM_ACCESS_TOKEN: 'IG-SECRET', FACEBOOK_PAGE_ID: '55', FACEBOOK_PAGE_ACCESS_TOKEN: 'FB-SECRET', YOUTUBE_CLIENT_ID: 'yt-id', YOUTUBE_CLIENT_SECRET: 'YT-SECRET', YOUTUBE_REFRESH_TOKEN: 'YT-REFRESH' };
const PROVIDERS = {
  'graph.instagram.com': [200, { id: '1789', user_id: '1789' }],
  'graph.facebook.com': [400, { error: { code: 190, error_subcode: 467, message: 'session invalid' } }],
  'oauth2.googleapis.com': [401, { error: 'invalid_client' }],
};

test('channel states reflect real provider responses: reconnect, setup, ready, connected, coming soon', async () => {
  const byKey = async (env) => Object.fromEntries((await load(env, PROVIDERS).getMarketingChannels(env)).map((c) => [c.key, c]));
  const s = await byKey({ ...SECRETS, RESEND_API_KEY: 're_x' });
  assert.equal(s.instagram.state, 'ready', 'connected but not enabled for publishing');
  assert.equal(s.facebook.state, 'reconnect'); assert.match(s.facebook.detail, /expired or revoked/);
  assert.equal(s.youtube.state, 'reconnect'); assert.match(s.youtube.detail, /secret rejected/);
  assert.equal(s.tiktok.state, 'setup');
  assert.equal(s.email.state, 'connected');
  for (const k of ['meta-ads', 'google-ads', 'tiktok-ads']) assert.equal(s[k].state, 'coming_soon');
  assert.equal(s.heygen.state, 'setup'); assert.match(s.heygen.detail, /free captioned video renderer/);
  const live = await byKey({ ...SECRETS, SOCIAL_DIRECT_PUBLISH: 'true', SOCIAL_PUBLISH_NETWORKS: 'instagram' });
  assert.equal(live.instagram.state, 'connected');
  const none = await byKey({});
  assert.equal(none.instagram.state, 'setup'); assert.equal(none.facebook.state, 'setup'); assert.equal(none.youtube.state, 'setup'); assert.equal(none.email.state, 'setup');
});

test('provider outages show as reconnect/unreachable rather than crashing the page, and no secret reaches the output', async () => {
  const env = { ...SECRETS };
  const lib = load(env, {});
  const channels = await lib.getMarketingChannels(env);
  assert.equal(channels.find((c) => c.key === 'facebook').detail, 'Could not reach the provider.');
  const okRun = JSON.stringify(await load(env, PROVIDERS).getMarketingChannels(env));
  for (const secret of Object.values(SECRETS)) if (secret.length > 4) assert.ok(!okRun.includes(secret), `leaked ${secret}`);
});
