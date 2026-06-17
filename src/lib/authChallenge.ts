import crypto from "crypto";

function secret() {
  return process.env.NEXTAUTH_SECRET ?? "dev-secret";
}

/** Creates a short-lived HMAC-signed challenge token for 2FA completion. */
export function createChallengeToken(userId: string): string {
  const exp = Date.now() + 5 * 60 * 1000; // 5-minute window
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Verifies the challenge token. Returns userId if valid, null otherwise. */
export function verifyChallengeToken(token: string): string | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto
      .createHmac("sha256", secret())
      .update(payload)
      .digest("base64url");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.userId || typeof data.exp !== "number" || data.exp < Date.now()) {
      return null;
    }
    return data.userId as string;
  } catch {
    return null;
  }
}
