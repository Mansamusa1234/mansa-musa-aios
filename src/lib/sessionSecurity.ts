import { db } from "@/lib/db";

const NOT_REMEMBERED_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000; // only write lastSeenAt if 5+ minutes stale

/**
 * Checks whether a JWT (by its embedded jti) should be treated as invalid:
 * explicitly revoked, or a non-"remember me" session past its 24h window.
 * Unknown jti (e.g. a token issued before this feature existed) is treated as
 * NOT revoked -- this is what keeps pre-existing sessions working untouched.
 * Fails open (not revoked) on any DB error so an outage never mass-logs-out users.
 */
export async function isTrustedSessionRevoked(jti: string): Promise<boolean> {
  try {
    const session = await db.trustedSession.findUnique({ where: { tokenId: jti } });
    if (!session) return false;
    if (session.revokedAt) return true;
    if (!session.rememberMe && Date.now() - session.createdAt.getTime() > NOT_REMEMBERED_MAX_AGE_MS) {
      return true;
    }

    if (Date.now() - session.lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS) {
      db.trustedSession.update({ where: { tokenId: jti }, data: { lastSeenAt: new Date() } }).catch(() => {});
    }
    return false;
  } catch (err) {
    console.error("[sessionSecurity] revocation check failed, failing open:", err);
    return false;
  }
}
