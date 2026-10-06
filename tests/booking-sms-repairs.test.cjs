/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness loads isolated TypeScript modules */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const testModule = { exports: {} };
  class Clock extends Date { static now() { return Date.parse('2026-10-06T00:00:00Z'); } }
  vm.runInNewContext(source, { module: testModule, exports: testModule.exports, require: name => name in mocks ? mocks[name] : require(name), process: { env: { NODE_ENV: 'test' } }, console, Date: Clock, Request, Response, Intl });
  return testModule.exports;
}
function bookingFixture(availability = {}) {
  let created = 0; let notified = 0; const afterCallbacks = []; let conflictWhere;
  const db = {
    user: { findUnique: async () => ({ id: 'owner', email: 'owner@example.com' }) },
    calendarAvailability: { findUnique: async () => availability === null ? null : ({ timezone: 'Europe/London', slotMins: 30, bufferMins: 15, tuesday: '09:00-17:00', wednesday: '09:00-17:00', saturday: null, ...availability }) },
    calendarBooking: { findFirst: async ({ where }) => { conflictWhere = where; return null; }, create: async ({ data }) => { created++; return data; } },
  };
  const api = load('src/app/api/public/book/[userId]/route.ts', {
    '@/lib/db': { db },
    'next/server': { NextResponse: { json: (body, opts = {}) => ({ body, status: opts.status ?? 200 }) }, after: callback => afterCallbacks.push(callback) },
    '@/lib/email': { sendEmail: async () => { notified++; }, bookingConfirmedGuestEmailHtml: () => '', newBookingOwnerEmailHtml: () => '' },
    '@/lib/email-automation': { triggerWorkflows: async () => { notified++; } },
    '@/lib/ratelimit': { checkRateLimit: async () => null, getIP: () => 'ip', limiters: {} },
  });
  return {
    async post(startAt, endAt) { return api.POST(new Request('https://app.test/api/public/book/owner', { method: 'POST', body: JSON.stringify({ guestName: 'Visitor', guestEmail: 'visitor@example.com', startAt, endAt }) }), { params: Promise.resolve({ userId: 'owner' }) }); },
    info: () => ({ created, notified, conflictWhere }),
    finish: async () => { for (const callback of afterCallbacks) await callback(); },
  };
}
test('booking enforces business timezone and keeps notifications alive after response', async () => {
  const f = bookingFixture();
  assert.equal((await f.post('2026-10-07T08:00:00Z', '2026-10-07T08:30:00Z')).status, 201); // 09:00 BST
  assert.equal(f.info().notified, 0);
  assert.equal(f.info().conflictWhere.OR[0].endAt.gt.toISOString(), '2026-10-07T07:45:00.000Z');
  await f.finish(); assert.equal(f.info().notified, 3);
});
test('closed days, out-of-hours and off-grid slots cannot create bookings', async () => {
  for (const [start, end] of [
    ['2026-10-07T07:00:00Z', '2026-10-07T07:30:00Z'],
    ['2026-10-10T08:00:00Z', '2026-10-10T08:30:00Z'],
    ['2026-10-07T08:10:00Z', '2026-10-07T08:40:00Z'],
    ['2026-10-07T15:45:00Z', '2026-10-07T16:15:00Z'],
  ]) { const f = bookingFixture(); assert.equal((await f.post(start, end)).status, 400); assert.equal(f.info().created, 0); }
});
test('missing availability and invalid business timezone fail closed', async () => {
  assert.equal((await bookingFixture(null).post('2026-10-07T08:00:00Z', '2026-10-07T08:30:00Z')).status, 404);
  assert.equal((await bookingFixture({ timezone: 'Invalid/Timezone' }).post('2026-10-07T08:00:00Z', '2026-10-07T08:30:00Z')).status, 400);
});
test('SMS produces exactly one escaped TwiML reply and never claims delivered', async () => {
  let logged;
  const api = load('src/app/api/receptionist/sms/route.ts', {
    '@/lib/db': { db: { receptionist: { findFirst: async () => ({ userId: 'owner', name: 'Receptionist', persona: 'friendly' }) }, whatsAppMessage: { findMany: async () => [], createMany: async ({ data }) => { logged = data; } } } },
    '@/lib/anthropic': { anthropic: { messages: { create: async () => ({ content: [{ type: 'text', text: 'Tea & <cake>' }] }) } } },
    'next/headers': { headers: async () => new Headers() }, '@/lib/twilio': { validateTwilioSignature: () => true },
    twilio: () => { throw new Error('Must not send an extra SDK message'); },
  });
  const result = await api.POST(new Request('https://app.test/api/receptionist/sms', { method: 'POST', body: new URLSearchParams({ From: '+441', To: '+442', Body: 'Hello' }) }));
  assert.match(await result.text(), /<Message>Tea &amp; &lt;cake&gt;<\/Message>/);
  assert.equal(logged[1].status, 'responded');
});
function loadSlotHelpers(now) {
  const file = fs.readFileSync('src/app/book/[userId]/page.tsx', 'utf8');
  const source = file.slice(file.indexOf('interface Availability'), file.indexOf('export default function')) + '\nmodule.exports = { generateSlots, businessInstant, groupByDate, fmtTime };';
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const testModule = { exports: {} };
  class Clock extends Date { constructor(...args) { if (args.length) super(...args); else super(now); } static now() { return Date.parse(now); } }
  vm.runInNewContext(output, { module: testModule, exports: testModule.exports, Date: Clock, Intl });
  return testModule.exports;
}
test('public slots use business timezone independently of visitor timezone and DST', () => {
  const previous = process.env.TZ;
  try {
    const avail = { timezone: 'Europe/London', slotMins: 30, bufferMins: 15, sunday: '09:00-10:00' };
    process.env.TZ = 'Pacific/Auckland';
    const kiwi = loadSlotHelpers('2026-10-24T22:30:00Z');
    const kiwiSlots = kiwi.generateSlots(avail, []);
    process.env.TZ = 'America/Los_Angeles';
    const la = loadSlotHelpers('2026-10-24T22:30:00Z');
    const laSlots = la.generateSlots(avail, []);
    assert.equal(kiwiSlots[0].start.toISOString(), '2026-10-25T09:00:00.000Z'); // GMT after clocks change
    assert.equal(laSlots[0].start.toISOString(), kiwiSlots[0].start.toISOString());
    assert.equal(la.fmtTime(laSlots[0].start, 'Europe/London'), '09:00');
    assert.equal(la.businessInstant(2026, 7, 5, 540, 'Europe/London').toISOString(), '2026-07-05T08:00:00.000Z'); // BST
    assert.equal(la.businessInstant(2026, 3, 29, 90, 'Europe/London'), null); // nonexistent 01:30
    const occupied = [{ startAt: laSlots[0].start.toISOString(), endAt: laSlots[0].end.toISOString() }];
    assert.ok(!la.generateSlots(avail, occupied).some(slot => slot.start.getTime() === laSlots[0].start.getTime()));
    assert.equal(la.generateSlots({ ...avail, slotMins: 0 }, []).length, 0);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
