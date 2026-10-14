const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

function run(script, env) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-diag-'));
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.resolve(script)], { cwd, env: { PATH: process.env.PATH, ...env } });
    let out = ''; child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
    child.on('close', (code) => resolve({ code, out, cwd }));
  });
}

test('Preview diagnostics go to the build log only: nothing is written under public/ and secrets are redacted', async () => {
  const server = http.createServer((req, res) => { res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'bad key sk-SECRET-123' })); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/v1/chat/completions`;
  try {
    const r = await run('scripts/preview-routellm-check.mjs', { VERCEL_ENV: 'preview', ABACUS_API_KEY: 'sk-SECRET-123', ABACUS_ROUTELLM_URL: url, HEYGEN_API_KEY: '' });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /\[routellm-check\].*"status":401/); assert.match(r.out, /\[env-inventory\]/);
    assert.doesNotMatch(r.out, /sk-SECRET-123/);
    assert.equal(fs.existsSync(path.join(r.cwd, 'public')), false, 'no publicly served diagnostics');
    const a = await run('scripts/preview-agent-proof.mjs', { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_MESSAGE: 'x [agent-proof]' });
    assert.equal(fs.existsSync(path.join(a.cwd, 'public')), false);
  } finally { server.close(); }
  for (const f of ['scripts/preview-routellm-check.mjs', 'scripts/preview-agent-proof.mjs']) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /writeFileSync|mkdirSync|"public\//);
});
