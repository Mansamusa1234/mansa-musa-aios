// Stripe price IDs by mode. With a test-mode key (sk_test_/rk_test_), STRIPE_PRICE_<PLAN>_TEST is used when
// set, so a Preview test environment can run real test-mode checkouts without touching the live price
// variables shared with Production. A live key always uses the live variables.
export function stripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_test_") || key.startsWith("rk_test_");
}

/** First configured price ID among `names`, preferring each name's _TEST variant in test mode. */
export function priceEnv(...names: string[]): string {
  const test = stripeTestMode();
  for (const name of names) {
    const value = (test ? process.env[`${name}_TEST`]?.trim() : undefined) || process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}
