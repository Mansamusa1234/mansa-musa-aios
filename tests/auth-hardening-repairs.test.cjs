const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');

function load(file, mocks, env = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(source, { module: mod, exports: mod.exports, require: (n) => (n in mocks ? mocks[n] : require(n)), process: { env: { NODE_ENV: 'test', ...env } }, console: { error() {}, log() {}, warn() {} }, Buffer, Date, Math, JSON, Promise, URL, Request, Headers, setTimeout });
  return mod.exports;
}
const json = { NextResponse: { json: (body, init = {}) => ({ status: init.status ?? 200, body }) } };
const ENV = { NEXTAUTH_SECRET: 'unit-test-secret' };

// ── 2FA login path ──────────────────────────────────────────────────────────
function authFixture({ backupCodes = null, limited = false } = {}) {
  const twoFactor = load('src/lib/twoFactor.ts', {});
  const challenge = load('src/lib/authChallenge.ts', {}, ENV);
  const secret = twoFactor.generateTotpSecret();
  const user = { id: 'u1', email: 'a@test.local', name: 'A', role: 'USER', twoFactorEnabled: true, twoFactorSecret: secret, twoFactorBackupCodes: backupCodes, failedLoginAttempts: 0, lockedUntil: null };
  const sessions = [];
  const claimed = new Set();
  const updateManyCalls = [];
  const db = {
    user: {
      findUnique: async () => ({ ...user }),
      update: async ({ data }) => Object.assign(user, data),
      updateMany: async ({ where, data }) => { updateManyCalls.push({ where, data }); if (where.twoFactorBackupCodes !== undefined && where.twoFactorBackupCodes !== user.twoFactorBackupCodes) return { count: 0 }; Object.assign(user, data); return { count: 1 }; },
    },
    trustedSession: { create: async ({ data }) => sessions.push(data) },
    auditLog: { findFirst: async () => null },
  };
  let config;
  const mocks = {
    'next-auth': (c) => { config = c; return { handlers: {}, auth: async () => null, signIn: async () => {}, signOut: async () => {} }; },
    '@auth/prisma-adapter': { PrismaAdapter: () => ({}) },
    'next-auth/providers/credentials': (o) => ({ id: 'credentials', ...o }),
    'next-auth/providers/github': () => ({}), 'next-auth/providers/google': () => ({}),
    'next/server': { after: () => {} },
    './db': { db }, './auth.config': { authConfig: { events: {} } },
    '@/lib/ratelimit': { checkRateLimit: async () => (limited ? { status: 429 } : null), limiters: {}, getIP: () => '1.2.3.4', claimOnce: async (key) => { if (claimed.has(key)) return false; claimed.add(key); return true; } },
    '@/lib/audit': { logAuditEvent: async () => {} }, '@/lib/email': { sendEmail: async () => ({ sent: true }), suspiciousLoginEmailHtml: () => '' },
    './auth.providers': { microsoftEntraIdProvider: [], appleProvider: [] },
    './authChallenge': challenge, './twoFactor': twoFactor,
  };
  load('src/lib/auth.ts', mocks, ENV);
  const credentials = config.providers.find((p) => p.id === 'credentials');
  const request = new Request('https://app.test/api/auth/callback/credentials');
  const login = (totp) => credentials.authorize({ challengeToken: challenge.createChallengeToken('u1'), totp }, request);
  // Current TOTP code, computed independently (RFC 6238, SHA-1, 30 s).
  const now = () => { const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0, value = 0; const out = []; for (const c of secret) { value = (value << 5) | alphabet.indexOf(c); bits += 5; if (bits >= 8) { bits -= 8; out.push((value >> bits) & 255); } } const counter = Buffer.alloc(8); counter.writeUInt32BE(Math.floor(Date.now() / 30000), 4); const h = crypto.createHmac('sha1', Buffer.from(out)).update(counter).digest(); const o = h[h.length - 1] & 15; return String(((h[o] & 127) << 24 | h[o + 1] << 16 | h[o + 2] << 8 | h[o + 3]) % 1e6).padStart(6, '0'); };
  return { login, now, user, sessions, config, updateManyCalls };
}

test('2FA: a valid code signs in once; replaying the same code is refused', async () => {
  const f = authFixture();
  const code = f.now();
  assert.equal((await f.login(code))?.id, 'u1');
  assert.equal(await f.login(code), null, 'replayed TOTP code');
  assert.equal(f.sessions.length, 1);
});

test('2FA: wrong codes count towards the account lockout, and a locked account cannot complete 2FA', async () => {
  const f = authFixture();
  for (let i = 0; i < 5; i++) assert.equal(await f.login('000000'), null);
  assert.equal(f.user.failedLoginAttempts, 5); assert.ok(f.user.lockedUntil > new Date());
  assert.equal(await f.login(f.now()), null, 'correct code refused while locked');
});

test('2FA: per-account rate limit stops guessing before any check', async () => {
  const f = authFixture({ limited: true });
  assert.equal(await f.login(f.now()), null);
  assert.equal(f.sessions.length, 0);
});

test('2FA: a backup code works exactly once', async () => {
  const twoFactor = load('src/lib/twoFactor.ts', {});
  const f = authFixture({ backupCodes: twoFactor.hashBackupCodes(['ABCD1234', 'EEEE5555']) });
  assert.equal((await f.login('abcd1234'))?.id, 'u1');
  assert.equal(await f.login('ABCD1234'), null);
  assert.equal(JSON.parse(f.user.twoFactorBackupCodes).length, 1);
});

test('OAuth sign-in marks the email verified only when the provider vouches for that same address', async () => {
  const f = authFixture();
  const ev = f.config.events.linkAccount;
  const user = { id: 'u9', email: 'Owner@Test.local' };
  await ev({ user, profile: { email: 'owner@test.local', email_verified: false } });
  await ev({ user, profile: { email: 'someone-else@test.local', email_verified: true } });
  await ev({ user, profile: { email: 'owner@test.local' } });
  assert.equal(f.updateManyCalls.length, 0, 'unverified, mismatched or unstated: no change');
  await ev({ user, profile: { email: 'owner@test.local', email_verified: true } });
  assert.equal(f.updateManyCalls.length, 1);
  assert.deepEqual({ ...f.updateManyCalls[0].where }, { id: 'u9', emailVerified: null });
  assert.ok(f.updateManyCalls[0].data.emailVerified instanceof Date || typeof f.updateManyCalls[0].data.emailVerified?.getTime === 'function');
});

test('2FA challenge tokens cannot be signed with a guessable key in production', () => {
  const challenge = load('src/lib/authChallenge.ts', {}, { NODE_ENV: 'production' });
  assert.throws(() => challenge.createChallengeToken('u1'), /not set/);
});

test('the first sign-in of a new account sends no "new sign-in" alert; a later sign-in from a new IP does', async () => {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('Correct-Horse-9!', 4);
  const run = async (priorLogins) => {
    const emails = []; const tasks = [];
    const user = { id: 'u2', email: 'b@test.local', name: 'B', role: 'USER', passwordHash: hash, twoFactorEnabled: false, failedLoginAttempts: 0, lockedUntil: null };
    let config;
    load('src/lib/auth.ts', {
      'next-auth': (c) => { config = c; return { handlers: {}, auth: async () => null, signIn: async () => {}, signOut: async () => {} }; },
      '@auth/prisma-adapter': { PrismaAdapter: () => ({}) }, 'next-auth/providers/credentials': (o) => ({ id: 'credentials', ...o }),
      'next-auth/providers/github': () => ({}), 'next-auth/providers/google': () => ({}), 'next/server': { after: (fn) => tasks.push(fn) },
      './db': { db: { user: { findFirst: async () => user, update: async () => user }, trustedSession: { create: async () => {} },
        auditLog: { findFirst: async ({ where }) => priorLogins.find((l) => !where.ip || l.ip === where.ip) ?? null } } },
      './auth.config': { authConfig: { events: {} } },
      '@/lib/ratelimit': { checkRateLimit: async () => null, limiters: {}, getIP: () => '9.9.9.9', claimOnce: async () => true },
      '@/lib/audit': { logAuditEvent: async () => {} }, '@/lib/email': { sendEmail: async (to, subject) => { emails.push(subject); return { sent: true }; }, suspiciousLoginEmailHtml: () => '' },
      './auth.providers': { microsoftEntraIdProvider: [], appleProvider: [] }, './authChallenge': {}, './twoFactor': {},
    }, { NEXTAUTH_SECRET: 's' });
    const creds = config.providers.find((p) => p.id === 'credentials');
    const signedIn = await creds.authorize({ email: 'b@test.local', password: 'Correct-Horse-9!' }, new Request('https://app.test'));
    for (const t of tasks) await t();
    return { signedIn, emails };
  };
  const first = await run([]);
  assert.equal(first.signedIn?.id, 'u2'); assert.deepEqual(first.emails, []);
  const later = await run([{ ip: '1.1.1.1' }]);
  assert.deepEqual(later.emails, ['New sign-in to your MansaMusaAI account']);
  assert.deepEqual((await run([{ ip: '9.9.9.9' }])).emails, []);
});
