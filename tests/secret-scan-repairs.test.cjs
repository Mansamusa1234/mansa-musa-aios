const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');

test('secret scan fails on a committed credential and never prints the value', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-scan-'));
  execFileSync('git', ['init', '-q'], { cwd: dir });
  const fake = 'sk_' + 'live_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3';
  fs.writeFileSync(path.join(dir, 'config.ts'), `export const key = "${fake}";\n`);
  fs.writeFileSync(path.join(dir, 'ok.ts'), 'const url = "postgresql://postgres:localtest@127.0.0.1:55432/db";\n');
  execFileSync('git', ['add', '.'], { cwd: dir });
  const r = spawnSync(process.execPath, [path.resolve('scripts/secret-scan.mjs')], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /config\.ts:1 {2}Stripe live key/);
  assert.doesNotMatch(r.stderr + r.stdout, new RegExp(fake));
  assert.doesNotMatch(r.stderr, /ok\.ts/, 'local throwaway database URLs are allowed');
});
