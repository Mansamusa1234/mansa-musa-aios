// Real Postgres (npm run journey:up): the app's db client, loaded as a Vercel Preview build without
// PREVIEW_DATABASE_URL, can read but cannot write. Runs in a child process so the env is isolated.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const DATABASE_URL = process.env.JOURNEY_DATABASE_URL || 'postgresql://postgres:localtest@127.0.0.1:55432/mansa_journey';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(DATABASE_URL).hostname)) throw new Error('Refusing to run against a non-local database.');
const child = `
const fs = require('fs'), path = require('path'), ts = require('typescript');
const root = ${JSON.stringify(path.join(__dirname, '..', '..'))};
const load = (file, mocks) => { const out = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText; const m = { exports: {} }; new Function('module', 'exports', 'require', out)(m, m.exports, (n) => mocks[n] ?? require(n)); return m.exports; };
const guard = load('src/lib/previewDbGuard.ts', {});
const { db } = load('src/lib/db.ts', { '@/lib/previewDbGuard': guard, '@prisma/client': require(path.join(root, 'node_modules/@prisma/client')) });
(async () => {
  const out = {};
  out.read = await db.user.count();
  const attempt = async (name, fn) => { try { await fn(); out[name] = 'ALLOWED'; } catch (e) { out[name] = e.name; } };
  await attempt('create', () => db.user.create({ data: { email: 'preview-guard@test.local' } }));
  await attempt('updateMany', () => db.user.updateMany({ data: { name: 'x' } }));
  await attempt('rawInsert', () => db.$executeRawUnsafe('DELETE FROM "User"'));
  await attempt('txWrite', () => db.$transaction(async (tx) => { await tx.user.deleteMany({}); }));
  out.after = await db.user.count();
  console.log(JSON.stringify(out));
  await db.$disconnect();
})();`;

test('Preview without PREVIEW_DATABASE_URL: reads work, every kind of write is refused, data unchanged', () => {
  const r = spawnSync(process.execPath, ['-e', child], { env: { PATH: process.env.PATH, VERCEL_ENV: 'preview', DATABASE_URL, NODE_ENV: 'production' }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.equal(typeof out.read, 'number');
  for (const k of ['create', 'updateMany', 'rawInsert', 'txWrite']) assert.equal(out[k], 'PreviewReadOnlyError', k);
  assert.equal(out.after, out.read);
});
