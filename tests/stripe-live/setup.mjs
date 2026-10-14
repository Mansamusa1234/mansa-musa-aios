// Real Stripe test mode (CI only): refuse anything but a test-mode key, then find or create the
// CI test price (£49/month, like live Starter). Prints the price id for GITHUB_OUTPUT.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY ?? "";
if (!/^(sk|rk)_test_/.test(key)) { console.error("Refusing: STRIPE_TEST_SECRET_KEY must be a test-mode key."); process.exit(1); }
const stripe = new Stripe(key);
const balance = await stripe.balance.retrieve();
if (balance.livemode) { console.error("Refusing: the key reports livemode."); process.exit(1); }

const LOOKUP = "mm_ci_starter_monthly";
const existing = await stripe.prices.list({ lookup_keys: [LOOKUP], active: true, limit: 1 });
const price = existing.data[0] ?? await stripe.prices.create({
  currency: "gbp", unit_amount: 4900, recurring: { interval: "month" }, lookup_key: LOOKUP,
  product_data: { name: "MansaMusaAI CI Starter (test)" },
});
console.log(`price_id=${price.id}`);
