// Real Stripe test-mode customer journey against the running app (CI): signup, email verification,
// login, checkout on Stripe's hosted page with Stripe's published test card, webhook fulfilment
// (delivered by the Stripe CLI), paid entitlement, cancel/reactivate, cancellation revokes access.
// Uses a throwaway CI database and a sandbox key only.
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PRICE = process.env.STRIPE_PRICE_STARTER_TEST;
const db = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "")) throw new Error("test-mode key required");
if (!/^postgres(ql)?:\/\/[^@]+@(127\.0\.0\.1|localhost)[:/]/.test(process.env.DATABASE_URL ?? "")) throw new Error("local CI database required");

const results = [];
const step = async (name, fn) => {
  try { const detail = await fn(); results.push({ step: name, ok: true, ...(detail ? { detail } : {}) }); }
  catch (err) { results.push({ step: name, ok: false, error: String(err?.message ?? err).slice(0, 400) }); throw err; }
};
const until = async (what, fn, ms = 90000) => {
  const end = Date.now() + ms;
  for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error(`timed out waiting for ${what}`); await new Promise((r) => setTimeout(r, 2000)); }
};

const jar = new Map();
const keep = (res) => { for (const c of res.headers.getSetCookie()) { const [kv] = c.split(";"); const i = kv.indexOf("="); jar.set(kv.slice(0, i), kv.slice(i + 1)); } };
const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
const call = async (method, path, body) => {
  const res = await fetch(BASE + path, { method, redirect: "manual", headers: { "Content-Type": "application/json", cookie: cookie() }, body: body ? JSON.stringify(body) : undefined });
  keep(res);
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const email = `ci-journey-${Date.now()}@example.com`;
const password = `Ci-Journey-${Date.now()}-Pass!`;
let userId; let subscriptionId;

try {
  await step("signup", async () => {
    const r = await call("POST", "/api/auth/register", { name: "CI Journey", email, password });
    if (r.status !== 201) throw new Error(`register ${r.status} ${JSON.stringify(r.body)}`);
    userId = (await until("user row", () => db.user.findUnique({ where: { email } }))).id;
  });
  await step("login (credentials)", async () => {
    let r = await fetch(`${BASE}/api/auth/csrf`); keep(r); const { csrfToken } = await r.json();
    r = await fetch(`${BASE}/api/auth/callback/credentials`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookie() }, body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${BASE}/dashboard` }) });
    keep(r);
    if (![...jar.keys()].some((k) => k.includes("session-token"))) throw new Error(`no session cookie (status ${r.status})`);
  });
  await step("unverified email cannot check out", async () => {
    const r = await call("POST", "/api/stripe/create-checkout", { priceId: PRICE });
    if (r.status !== 403 || r.body.code !== "EMAIL_NOT_VERIFIED") throw new Error(`expected 403 EMAIL_NOT_VERIFIED, got ${r.status}`);
  });
  await step("free account cannot use a paid feature (CRM)", async () => {
    const r = await call("POST", "/api/crm/leads", { name: "Before payment" });
    if (r.status !== 403) throw new Error(`expected 403, got ${r.status}`);
  });
  await step("email verification link (single use)", async () => {
    const t = await until("verification token", () => db.emailVerificationToken.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }));
    const first = await call("POST", "/api/auth/verify-email", { token: t.token });
    const second = await call("POST", "/api/auth/verify-email", { token: t.token });
    if (first.status !== 200 || second.status !== 400) throw new Error(`verify ${first.status}, reuse ${second.status}`);
  });
  let checkoutUrl;
  await step("checkout session created by the app (real Stripe test mode)", async () => {
    const r = await call("POST", "/api/stripe/create-checkout", { priceId: PRICE });
    if (r.status !== 200 || !/^https:\/\/checkout\.stripe\.com\//.test(r.body.url ?? "")) throw new Error(`checkout ${r.status} ${JSON.stringify(r.body)}`);
    checkoutUrl = r.body.url;
  });
  await step("pay on Stripe Checkout with the published test card", async () => {
    const browser = await chromium.launch();
    try {
      // Same signed-in session as the API calls, so Stripe's return to /billing renders for this customer.
      const context = await browser.newContext();
      await context.addCookies([...jar].map(([name, value]) => ({ name, value, url: BASE })));
      const page = await context.newPage();
      await page.goto(checkoutUrl, { waitUntil: "domcontentloaded" });
      const cardTab = page.locator('[data-testid="card-accordion-item-button"]');
      if (await cardTab.isVisible({ timeout: 8000 }).catch(() => false)) await cardTab.click();
      await page.locator("#cardNumber").fill("4242424242424242", { timeout: 30000 });
      await page.locator("#cardExpiry").fill("12 / 34");
      await page.locator("#cardCvc").fill("123");
      const name = page.locator("#billingName"); if (await name.isVisible().catch(() => false)) await name.fill("CI Journey");
      const country = page.locator("#billingCountry"); if (await country.isVisible().catch(() => false)) await country.selectOption("GB");
      const postcode = page.locator("#billingPostalCode"); if (await postcode.isVisible().catch(() => false)) await postcode.fill("SW1A 1AA");
      const save = page.locator("#enableStripePass"); if (await save.isChecked().catch(() => false)) await save.uncheck();
      await page.locator('[data-testid="hosted-payment-submit-button"], button[type="submit"]').first().click();
      await page.waitForURL((u) => u.toString().startsWith(`${BASE}/billing?success=true`), { timeout: 90000 });
      await page.getByText(/Your paid plan is active|Checkout returned/).first().waitFor({ timeout: 30000 });
      return { returnedTo: new URL(page.url()).pathname + new URL(page.url()).search };
    } finally { await browser.close(); }
  });
  await step("webhook fulfils the subscription (ACTIVE, correct price)", async () => {
    const row = await until("ACTIVE subscription", () => db.subscription.findFirst({ where: { userId, status: "ACTIVE", stripePriceId: PRICE } }));
    subscriptionId = row.stripeSubscriptionId;
    const live = await stripe.subscriptions.retrieve(subscriptionId);
    if (live.status !== "active" || live.livemode) throw new Error(`Stripe subscription ${live.status} livemode=${live.livemode}`);
    return { periodEnd: row.currentPeriodEnd?.toISOString() };
  });
  await step("paid plan unlocks the paid feature (CRM)", async () => {
    const r = await call("POST", "/api/crm/leads", { name: "After payment" });
    if (r.status !== 200 && r.status !== 201) throw new Error(`expected success, got ${r.status} ${JSON.stringify(r.body)}`);
  });
  await step("checkout refuses a second subscription", async () => {
    const r = await call("POST", "/api/stripe/create-checkout", { priceId: PRICE });
    if (r.status !== 409) throw new Error(`expected 409, got ${r.status}`);
  });
  await step("customer portal session", async () => {
    const r = await call("POST", "/api/stripe/portal");
    if (r.status !== 200 || !/^https:\/\/billing\.stripe\.com\//.test(r.body.url ?? "")) throw new Error(`portal ${r.status} ${JSON.stringify(r.body)} (save the Customer portal settings once in the sandbox dashboard)`);
  });
  await step("cancel at period end keeps access until then", async () => {
    const r = await call("POST", "/api/stripe/cancel");
    if (r.status !== 200) throw new Error(`cancel ${r.status}`);
    if (!(await stripe.subscriptions.retrieve(subscriptionId)).cancel_at_period_end) throw new Error("Stripe not scheduled to cancel");
    const lead = await call("POST", "/api/crm/leads", { name: "During notice" });
    if (lead.status !== 200 && lead.status !== 201) throw new Error(`access lost early: ${lead.status}`);
  });
  await step("reactivate", async () => {
    const r = await call("POST", "/api/stripe/reactivate");
    if (r.status !== 200 || (await stripe.subscriptions.retrieve(subscriptionId)).cancel_at_period_end) throw new Error(`reactivate ${r.status}`);
  });
  await step("subscription ending (Stripe cancels) revokes paid access via webhook", async () => {
    await stripe.subscriptions.cancel(subscriptionId);
    await until("CANCELED status", () => db.subscription.findFirst({ where: { userId, status: "CANCELED" } }));
    const r = await call("POST", "/api/crm/leads", { name: "After cancellation" });
    if (r.status !== 403) throw new Error(`expected 403 after cancellation, got ${r.status}`);
  });
} catch {
  // Recorded in results; the summary below reports which step failed.
} finally {
  const ok = results.length > 0 && results.every((r) => r.ok) && results.length === 14;
  console.log(JSON.stringify({ ok, steps: results }, null, 2));
  await db.$disconnect();
  process.exit(ok ? 0 : 1);
}
