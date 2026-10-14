// First-touch marketing attribution carried from the landing visit to Stripe checkout.
export const UTM_COOKIE = "mm_utm";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

/** Parses the first-touch UTM cookie into Stripe-safe metadata (short, plain values only). */
export function utmMetadata(raw: string | undefined | null): Record<string, string> {
  if (!raw) return {};
  let parsed: unknown;
  try { parsed = JSON.parse(decodeURIComponent(raw)); } catch { return {}; }
  if (!parsed || typeof parsed !== "object") return {};
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = (parsed as Record<string, unknown>)[key];
    if (typeof value === "string" && /^[\w.\-]{1,100}$/.test(value)) out[key] = value;
  }
  return out;
}
