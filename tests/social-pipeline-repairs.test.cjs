const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks, env = {}, fetchImpl) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: n => n in mocks ? mocks[n] : require(n), process: { env }, console: { error() {}, warn() {}, log() {} }, Buffer, Date, Intl, URL, URLSearchParams, Request, JSON, Promise, AbortSignal, fetch: fetchImpl ?? (async () => { throw new Error('unexpected network'); }) });
  return mod.exports;
}
const response = { NextResponse: { json: (body, options = {}) => ({ status: options.status ?? 200, body }) } };

function memoryDb() {
  const rows = []; let n = 0;
  const contentQueue = {
    rows,
    findMany: async ({ where }) => rows.filter(r => r.type === where.type && r.status === where.status && r.platform === where.platform),
    findFirst: async ({ where }) => rows.find(r => r.type === where.type && r.platform === where.platform && r.metadata.includes(where.metadata.contains)) ?? null,
    findUnique: async ({ where }) => { const r = rows.find(x => x.id === where.id); return r ? { ...r } : null; },
    create: async ({ data }) => { const r = { id: `cq${++n}`, updatedAt: new Date(), ...data }; rows.push(r); return r; },
    update: async ({ where, data }) => Object.assign(rows.find(r => r.id === where.id), data),
    updateMany: async ({ where, data }) => { const r = rows.find(x => x.id === where.id && x.status === where.status && x.updatedAt === where.updatedAt); if (!r) return { count: 0 }; Object.assign(r, data); return { count: 1 }; },
  };
  return { contentQueue };
}

function cron(db, env = {}, heygen = {}) {
  const calls = { create: 0 };
  const social = {
    getTodaysScript: () => ({ title: 'Missed Calls', script: 'Script text', caption: 'Caption', hashtags: ['#AI'], platform: 'instagram' }),
    MANSA_INTRO_SCRIPT: { title: 'Intro', script: 'Intro', caption: 'Intro', hashtags: [], platform: 'youtube' },
    createHeyGenVideo: async () => { calls.create++; return heygen.videoId ?? 'vid_1'; },
    getHeyGenVideoUrl: async () => heygen.url ?? null,
  };
  const cronUtils = load('src/lib/cronUtils.ts', { 'next/server': response, '@/lib/hospital': { recordHospitalFailure: async () => {} } }, { CRON_SECRET: 's' });
  const metricool = load('src/lib/metricool.ts', {}, {});
  const api = load('src/app/api/cron/social-post/route.ts', { '@/lib/social-automation': social, '@/lib/cronUtils': cronUtils, '@/lib/db': { db }, '@/lib/metricool': metricool }, env);
  const run = () => api.GET(new Request('https://app.test/api/cron/social-post', { headers: { authorization: 'Bearer s' } }));
  return { run, calls };
}

test('daily cron queues one draft for approval and publishes nothing', async () => {
  const db = memoryDb(); const c = cron(db);
  const first = await c.run(); assert.equal(first.status, 200); assert.equal(first.body.queued, true);
  assert.equal(db.contentQueue.rows.length, 1);
  const row = db.contentQueue.rows[0]; assert.equal(row.status, 'PENDING'); assert.equal(row.type, 'social_post');
  assert.deepEqual(JSON.parse(row.metadata).networks, ['facebook', 'instagram', 'tiktok', 'youtube']);
  const second = await c.run(); assert.equal(second.body.queued, false); assert.equal(db.contentQueue.rows.length, 1);
  const src = fs.readFileSync('src/app/api/cron/social-post/route.ts', 'utf8'); assert.doesNotMatch(src, /postTo[A-Z]/);
});

test('HeyGen spends credits only when explicitly enabled, then the video is attached on a later run', async () => {
  const off = memoryDb(); const c1 = cron(off, { HEYGEN_API_KEY: 'k', HEYGEN_AVATAR_ID: 'a', HEYGEN_VOICE_ID: 'v' });
  await c1.run(); assert.equal(c1.calls.create, 0);
  const on = memoryDb(); const env = { SOCIAL_HEYGEN_ENABLED: 'true', HEYGEN_API_KEY: 'k', HEYGEN_AVATAR_ID: 'a', HEYGEN_VOICE_ID: 'v' };
  await cron(on, env).run();
  assert.equal(JSON.parse(on.contentQueue.rows[0].metadata).videoId, 'vid_1');
  await cron(on, env, { url: 'https://cdn.heygen.test/v.mp4' }).run();
  assert.equal(JSON.parse(on.contentQueue.rows[0].metadata).videoUrl, 'https://cdn.heygen.test/v.mp4');
});

function approve(row, { env = {}, fetchOk = true } = {}) {
  const db = memoryDb(); db.contentQueue.rows.push(row); const sent = [];
  const fetchImpl = async (url, init) => { sent.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) }); return { ok: fetchOk, status: fetchOk ? 200 : 403, json: async () => (fetchOk ? { data: { id: 1000 + sent.length } } : { error: 'forbidden' }) }; };
  const metricool = load('src/lib/metricool.ts', {}, env, fetchImpl);
  const api = load('src/app/api/content-queue/[id]/route.ts', { 'next/server': response, '@/lib/auth': { auth: async () => ({ user: { id: 'admin', role: 'ADMIN' } }) }, '@/lib/db': { db }, '@/lib/email': { sendEmail: async () => ({ sent: true }) }, '@/lib/metricool': metricool, zod: require('zod') }, env);
  return { db, sent, run: () => api.PATCH(new Request(`https://app.test/api/content-queue/${row.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }), { params: Promise.resolve({ id: row.id }) }) };
}
const draft = (meta) => ({ id: 'cq9', type: 'social_post', platform: 'multi', title: 'Day', content: 'Caption #AI', status: 'PENDING', updatedAt: new Date(), metadata: JSON.stringify({ kind: 'daily_video', day: '2026-10-14', networks: ['facebook', 'instagram', 'tiktok', 'youtube'], ...meta }) });
const MC = { METRICOOL_USER_TOKEN: 'tok', METRICOOL_USER_ID: 'u1', METRICOOL_BLOG_ID: 'b1', NEXT_PUBLIC_APP_URL: 'https://www.mansamusainitiative.com' };

test('approval is refused while the video is still rendering', async () => {
  const a = approve(draft({ videoId: 'vid_1', videoUrl: null }), { env: MC });
  assert.equal((await a.run()).status, 409); assert.equal(a.db.contentQueue.rows[0].status, 'PENDING'); assert.equal(a.sent.length, 0);
});

test('approved video drafts become Metricool drafts per network with UTM attribution, never SENT', async () => {
  const a = approve(draft({ videoId: 'vid_1', videoUrl: 'https://cdn.heygen.test/v.mp4' }), { env: MC });
  const res = await a.run();
  assert.equal(res.status, 200, JSON.stringify(res.body)); assert.equal(res.body.status, 'APPROVED'); assert.equal(res.body.metricoolDraft, true);
  assert.deepEqual(a.sent.map(s => s.body.providers[0].network), ['facebook', 'instagram', 'tiktok', 'youtube']);
  for (const s of a.sent) {
    assert.match(s.url, /^https:\/\/app\.metricool\.com\/api\/v2\/scheduler\/posts\?blogId=b1&userId=u1$/);
    assert.equal(s.headers['X-Mc-Auth'], 'tok');
    assert.equal(s.body.draft, true); assert.equal(s.body.autoPublish, false);
    assert.deepEqual(s.body.media, ['https://cdn.heygen.test/v.mp4']);
    assert.match(s.body.text, new RegExp(`utm_source=${s.body.providers[0].network}&utm_medium=social&utm_campaign=cq9`));
    assert.match(s.body.publicationDate.dateTime, /^\d{4}-\d{2}-\d{2}T18:00:00$/); assert.equal(s.body.publicationDate.timezone, 'Europe/London');
  }
  assert.equal(a.db.contentQueue.rows[0].status, 'APPROVED'); assert.equal(a.db.contentQueue.rows[0].sentAt, undefined);
});

test('text-only drafts go to Facebook only; auto-publish requires explicit opt-in', async () => {
  const a = approve(draft({ videoUrl: null }), { env: { ...MC, METRICOOL_AUTO_PUBLISH: 'true' } });
  await a.run();
  assert.deepEqual(a.sent.map(s => s.body.providers[0].network), ['facebook']);
  assert.equal(a.sent[0].body.draft, false); assert.equal(a.sent[0].body.autoPublish, true);
});

test('Metricool rejection leaves the draft pending', async () => {
  const a = approve(draft({ videoUrl: 'https://cdn.heygen.test/v.mp4' }), { env: MC, fetchOk: false });
  assert.equal((await a.run()).status, 502); assert.equal(a.db.contentQueue.rows[0].status, 'PENDING');
});
