const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function fixture({ role = 'ADMIN', session = true, cookie = null, tokenOk = true } = {}) {
  const jar = new Map(cookie ? [['yt_oauth_state', cookie]] : []);
  const upserts = []; const fetches = [];
  const mocks = {
    'next/headers': { cookies: async () => ({ get: (n) => (jar.has(n) ? { value: jar.get(n) } : undefined), set: (n, v) => jar.set(n, v), delete: (n) => jar.delete(n) }) },
    'next/server': { NextResponse: { json: (body, init = {}) => ({ status: init.status ?? 200, body }), redirect: (url) => ({ status: 307, location: String(url) }) } },
    '@/lib/auth': { auth: async () => (session ? { user: { id: 'admin1', role } } : null) },
    '@/lib/db': { db: { account: { upsert: async (a) => { upserts.push(a); } } } },
    '@/lib/social-automation': { YOUTUBE_ACCOUNT: { provider: 'youtube-social', providerAccountId: 'channel' } },
  };
  const source = ts.transpileModule(fs.readFileSync('src/app/api/auth/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => (n in mocks ? mocks[n] : require(n)), process: { env: { YOUTUBE_CLIENT_ID: 'cid', YOUTUBE_CLIENT_SECRET: 'csecret' } }, console: { error() {} }, Buffer, URL, URLSearchParams, Math, Date, JSON,
    fetch: async (url, init) => { fetches.push({ url, body: String(init.body) }); return { ok: tokenOk, status: tokenOk ? 200 : 401, json: async () => (tokenOk ? { refresh_token: 'rt-SECRET', access_token: 'at-SECRET', expires_in: 3600 } : { error: 'invalid_client' }) }; } });
  const get = (qs = '') => mod.exports.GET(new Request(`https://www.mansamusainitiative.com/api/auth/${qs}`));
  return { get, jar, upserts, fetches };
}

test('only a signed-in administrator can start the YouTube connection', async () => {
  assert.equal((await fixture({ session: false }).get()).status, 401);
  assert.equal((await fixture({ role: 'USER' }).get()).status, 403);
  const f = fixture();
  const res = await f.get();
  assert.equal(res.status, 307);
  const state = new URL(res.location).searchParams.get('state');
  assert.ok(state && state === f.jar.get('yt_oauth_state'), 'state is bound to this browser');
});

test('a callback without the matching state is refused before any token exchange (CSRF)', async () => {
  const f = fixture({ cookie: 'a'.repeat(48) });
  assert.equal((await f.get('?code=abc&state=' + 'b'.repeat(48))).status, 400);
  assert.equal((await fixture().get('?code=abc&state=x')).status, 400);
  assert.equal(f.fetches.length, 0); assert.equal(f.upserts.length, 0);
});

test('a valid callback stores the refresh token server-side and never returns it', async () => {
  const state = 'c'.repeat(48);
  const f = fixture({ cookie: state });
  const res = await f.get(`?code=abc&state=${state}`);
  assert.equal(res.status, 200); assert.equal(res.body.connected, true);
  assert.doesNotMatch(JSON.stringify(res.body), /SECRET/);
  assert.equal(f.upserts[0].create.refresh_token, 'rt-SECRET'); assert.equal(f.upserts[0].create.provider, 'youtube-social');
  assert.equal(f.jar.has('yt_oauth_state'), false, 'state is single use');
  const bad = fixture({ cookie: state, tokenOk: false });
  const failed = await bad.get(`?code=abc&state=${state}`);
  assert.equal(failed.status, 502); assert.equal(bad.upserts.length, 0);
});
