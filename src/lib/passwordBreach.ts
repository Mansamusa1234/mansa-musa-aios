import crypto from "crypto";

/**
 * Checks the password against HaveIBeenPwned's Pwned Passwords API using k-anonymity:
 * only the first 5 characters of the SHA-1 hash are sent, never the password or full hash.
 * Server-only (uses Node's crypto module) -- never import this from a client component.
 * Fails open (treats as "not found") on any network/API error so an outage never blocks signup.
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(3000),
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return false;

    const body = await res.text();
    return body.split("\n").some((line) => line.split(":")[0]?.trim() === suffix);
  } catch (err) {
    console.error("[passwordBreach] check failed, failing open:", err);
    return false;
  }
}
