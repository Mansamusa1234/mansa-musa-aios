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
import { checkRateLimit, limiters, getIP } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { sendEmail, suspiciousLoginEmailHtml } from "@/lib/email";
import { microsoftEntraIdProvider, appleProvider } from "./auth.providers";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.string().optional(),
});

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...microsoftEntraIdProvider,
    ...appleProvider,
    Credentials({
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip = request ? getIP(request) : "anonymous";
        const userAgent = request?.headers.get("user-agent") ?? undefined;

        // Best-effort rate limit -- fails open so a Redis hiccup never blocks a real login.
        const limited = await checkRateLimit(limiters.login, ip).catch(() => null);
        if (limited) return null;

        const user = await db.user.findUnique({ where: { email: parsed.data.email } });

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

        const rememberMe = parsed.data.rememberMe === "true";
        const jti = crypto.randomUUID();

        const priorSuccessFromThisIp =
          ip !== "anonymous" ? await db.auditLog.findFirst({ where: { userId: user.id, event: "LOGIN_SUCCESS", ip } }) : null;
        const isNewIp = ip !== "anonymous" && !priorSuccessFromThisIp;

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
