const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadCronUtils(environment) {
  const source = ts.transpileModule(fs.readFileSync('src/lib/cronUtils.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const testModule = { exports: {} };
  const mocks = {
    'next/server': { NextResponse: { json: (body, options = {}) => ({ status: options.status ?? 200, body }) } },
    '@/lib/hospital': { recordHospitalFailure: async () => {} },
  };
  vm.runInNewContext(source, { module: testModule, exports: testModule.exports, require: name => name in mocks ? mocks[name] : require(name), process: { env: environment }, console, Buffer, Request, Date, URL });
  return testModule.exports;
}
const cronRequest = authorization => new Request('https://app.test/api/cron/win-back', { headers: authorization ? { authorization } : {} });

test('cron routes fail closed when CRON_SECRET is unset', async () => {
  const { withCron } = loadCronUtils({});
  let ran = false;
  const handler = withCron(async () => { ran = true; return {}; });
  assert.equal((await handler(cronRequest('Bearer undefined'))).status, 401);
  assert.equal((await handler(cronRequest())).status, 401);
  assert.equal(ran, false);
});

test('cron routes reject wrong or missing secrets and accept the configured one', async () => {
  const { withCron } = loadCronUtils({ CRON_SECRET: 's3cret' });
  let runs = 0;
  const handler = withCron(async () => { runs++; return { done: true }; });
  assert.equal((await handler(cronRequest('Bearer wrong'))).status, 401);
  assert.equal((await handler(cronRequest('Bearer s3cret-extra'))).status, 401);
  assert.equal((await handler(cronRequest())).status, 401);
  const ok = await handler(cronRequest('Bearer s3cret'));
  assert.equal(ok.status, 200);
  assert.equal(ok.body.done, true);
  assert.equal(runs, 1);
});
