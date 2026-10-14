import crypto from "crypto";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { after } from "next/server";
import { db } from "./db";
import { authConfig } from "./auth.config";
import { checkRateLimit, claimOnce, limiters, getIP } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail, suspiciousLoginEmailHtml } from "@/lib/email";
import { microsoftEntraIdProvider, appleProvider } from "./auth.providers";
import { verifyChallengeToken } from "./authChallenge";
import { verifyTotpStep, verifyBackupCode } from "./twoFactor";

const githubProvider =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? [
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
      ]
    : [];

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  rememberMe: z.string().optional(),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const REMEMBERED_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** True when the identity provider itself vouches for the email address. */
function providerVerifiedEmail(profile: unknown): boolean {
  const verified = (profile as { email_verified?: unknown } | undefined)?.email_verified;
  return verified === true || verified === "true";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: REMEMBERED_SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: REMEMBERED_SESSION_MAX_AGE_SECONDS },
  events: {
    ...authConfig.events,
    // An OAuth sign-in whose provider confirms the address counts as email verification.
    async linkAccount({ user, profile }) {
      if (!user.id || !user.email || !providerVerifiedEmail(profile)) return;
      if (String((profile as { email?: unknown })?.email ?? "").toLowerCase() !== user.email.toLowerCase()) return;
      await db.user.updateMany({ where: { id: user.id, emailVerified: null }, data: { emailVerified: new Date() } });
    },
  },
  providers: [
    ...githubProvider,
    ...googleProvider,
    ...microsoftEntraIdProvider,
    ...appleProvider,
    Credentials({
      async authorize(credentials, request) {
        // ── Path A: 2FA completion via HMAC-signed challenge token ──────────
        if (credentials?.challengeToken && credentials?.totp) {
          const userId = verifyChallengeToken(credentials.challengeToken as string);
          if (!userId) return null;

          // Limit guesses per account (not just per IP), and honour the shared lockout.
          const limitedSecondFactor = await checkRateLimit(limiters.twoFactor, userId).catch(() => null);
          if (limitedSecondFactor) return null;
          const user = await db.user.findUnique({ where: { id: userId } });
          if (!user) return null;
          if (user.lockedUntil && user.lockedUntil > new Date()) return null;

          const code = String(credentials.totp).trim();
          let secondFactorOk = false;

          if (user.twoFactorEnabled) {
            if (!user.twoFactorSecret) return null;
            const step = verifyTotpStep(code, user.twoFactorSecret);
            if (step !== null) {
              // Each authenticator code works once (replay protection across the ±1 step window).
              secondFactorOk = await claimOnce(`totp:${user.id}:${step}`, 120);
            } else if (user.twoFactorBackupCodes) {
              const { valid, remaining } = verifyBackupCode(code, user.twoFactorBackupCodes);
              if (valid) {
                // Consume atomically: a backup code cannot be used twice by concurrent requests.
                const consumed = await db.user.updateMany({
                  where: { id: user.id, twoFactorBackupCodes: user.twoFactorBackupCodes },
                  data: { twoFactorBackupCodes: JSON.stringify(remaining) },
                });
                secondFactorOk = consumed.count === 1;
              }
            }
          } else if (/^\d{6}$/.test(code)) {
            // Accounts without authenticator 2FA still require a one-time email code.
            const identifier = `login:${user.id}`;
            const token = crypto.createHash("sha256").update(code).digest("hex");
            const consumed = await db.verificationToken.deleteMany({
              where: { identifier, token, expires: { gt: new Date() } },
            });
            secondFactorOk = consumed.count === 1;
            if (secondFactorOk) {
              // Remove any stale codes for this sign-in identity after a successful claim.
              await db.verificationToken.deleteMany({ where: { identifier } });
            }
          }
          if (!secondFactorOk) {
            const attempts = user.failedLoginAttempts + 1;
            const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
            await db.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: attempts, lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null },
            });
            return null;
          }
          if (user.failedLoginAttempts > 0) {
            await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
          }

          const rememberMe = credentials.rememberMe === "true";
          const jti = crypto.randomUUID();
          const ip = request ? getIP(request) : "anonymous";
          const userAgent = request?.headers.get("user-agent") ?? undefined;

          await db.trustedSession.create({
            data: { userId: user.id, tokenId: jti, ip, userAgent, rememberMe },
          });
          after(() =>
            logAuditEvent({ userId: user.id, event: "LOGIN_SUCCESS", ip, userAgent })
          );
          return { id: user.id, email: user.email, name: user.name, role: user.role, jti };
        }

        // ── Path B: Normal credentials ─────────────────────────────────────
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip = request ? getIP(request) : "anonymous";
        const userAgent = request?.headers.get("user-agent") ?? undefined;

        // Best-effort rate limit -- fails open so a Redis hiccup never blocks a real login.
        const limited = await checkRateLimit(limiters.login, ip).catch(() => null);
        if (limited) return null;

        const user = await db.user.findFirst({ where: { email: { equals: parsed.data.email, mode: "insensitive" } } });

        if (!user?.passwordHash) {
          after(() => logAuditEvent({ event: "LOGIN_FAILURE", ip, userAgent, metadata: { email: parsed.data.email, reason: "no_account" } }));
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          after(() => logAuditEvent({ userId: user.id, event: "LOGIN_FAILURE", ip, userAgent, metadata: { reason: "locked" } }));
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts, lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null },
          });
          after(() => logAuditEvent({ userId: user.id, event: shouldLock ? "ACCOUNT_LOCKED" : "LOGIN_FAILURE", ip, userAgent }));
          return null;
        }

        // Users with 2FA enabled must go through the challenge-token path
        if (user.twoFactorEnabled) return null;

        const rememberMe = parsed.data.rememberMe === "true";
        const jti = crypto.randomUUID();

        // Alert on a new location only when there is an earlier sign-in to compare with
        // (a brand-new account's first sign-in is not suspicious).
        const [priorSuccessFromThisIp, anyPriorSuccess] = ip !== "anonymous"
          ? await Promise.all([
            db.auditLog.findFirst({ where: { userId: user.id, event: "LOGIN_SUCCESS", ip } }),
            db.auditLog.findFirst({ where: { userId: user.id, event: "LOGIN_SUCCESS" } }),
          ])
          : [null, null];
        const isNewIp = ip !== "anonymous" && !!anyPriorSuccess && !priorSuccessFromThisIp;

        await Promise.all([
          db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } }),
          db.trustedSession.create({ data: { userId: user.id, tokenId: jti, ip, userAgent, rememberMe } }),
        ]);

        after(async () => {
          await logAuditEvent({ userId: user.id, event: "LOGIN_SUCCESS", ip, userAgent });
          if (isNewIp) {
            await logAuditEvent({ userId: user.id, event: "SUSPICIOUS_LOGIN", ip, userAgent });
            await sendEmail(
              user.email,
              "New sign-in to your MansaMusaAI account",
              suspiciousLoginEmailHtml({ ip, userAgent, when: new Date().toUTCString() })
            );
          }
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role, jti };
      },
    }),
  ],
});
