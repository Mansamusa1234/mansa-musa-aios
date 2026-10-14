const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/lib/previewDbGuard.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(source, { module: mod, exports: mod.exports, Array, Set, Error });
const { resolveDatabaseTarget, isWriteOperation } = mod.exports;

test('Preview never gets a writable connection to the production DATABASE_URL', () => {
  assert.deepEqual({ ...resolveDatabaseTarget({ VERCEL_ENV: 'preview', DATABASE_URL: 'prod' }) }, { url: 'prod', readOnly: true, source: 'DATABASE_URL' });
  assert.deepEqual({ ...resolveDatabaseTarget({ VERCEL_ENV: 'preview', DATABASE_URL: 'prod', PREVIEW_DATABASE_URL: 'branch' }) }, { url: 'branch', readOnly: false, source: 'PREVIEW_DATABASE_URL' });
  assert.equal(resolveDatabaseTarget({ VERCEL_ENV: 'preview', DATABASE_URL: 'prod', PREVIEW_DATABASE_URL: ' prod ' }).readOnly, true, 'pointing PREVIEW_DATABASE_URL at production does not unlock writes');
  assert.equal(resolveDatabaseTarget({ VERCEL_ENV: 'production', DATABASE_URL: 'prod', PREVIEW_DATABASE_URL: 'branch' }).url, 'prod');
  assert.equal(resolveDatabaseTarget({ DATABASE_URL: 'local' }).readOnly, false);
});

test('write operations, raw writes and unknown raw SQL are classified as writes; plain reads are not', () => {
  for (const op of ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany', '$executeRaw', '$executeRawUnsafe']) assert.equal(isWriteOperation(op, {}), true, op);
  for (const op of ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy']) assert.equal(isWriteOperation(op, {}), false, op);
  assert.equal(isWriteOperation('$queryRaw', { strings: ['SELECT 1'], values: [] }), false);
  assert.equal(isWriteOperation('$queryRawUnsafe', ['SELECT * FROM "User" WHERE id = $1', 'x']), false);
  assert.equal(isWriteOperation('$queryRawUnsafe', ['INSERT INTO "User" (id) VALUES ($1) RETURNING id', 'x']), true);
  assert.equal(isWriteOperation('$queryRaw', { strings: ['WITH x AS (DELETE FROM "User" RETURNING *) SELECT * FROM x'], values: [] }), true);
  assert.equal(isWriteOperation('$queryRaw', { strings: ['SELECT nextval(', ')'], values: [] }), true);
  assert.equal(isWriteOperation('$queryRaw', {}), true, 'unreadable raw SQL is refused');
});
