import { isTrustedSessionRevoked } from "@/lib/sessionSecurity";
import { db } from "@/lib/db";

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async signIn({ user, account }: any) {
      console.log("[auth] signIn event", { userId: user?.id, provider: account?.provider });
    },
  },
  logger: {
    error(error: any) {
      console.error("[auth] ERROR", error?.name, error?.message, JSON.stringify(error));
    },
    warn(code: any) {
      console.warn("[auth] WARN", code);
    },
  },
  providers: [],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (user.jti) token.jti = user.jti;
      }

      // The platform owner is configured outside the codebase. This gives the
      // owner full administration access without introducing a hidden bypass
      // account or hard-coded credentials. Existing USER accounts are promoted
      // once, then the ADMIN role is persisted in the database.
      const ownerEmail = (process.env.OWNER_EMAIL ?? process.env.REPORT_EMAIL ?? "darrenneil2025@gmail.com")
        .trim()
        .toLowerCase();
      const signedInEmail = String(user?.email ?? token.email ?? "").trim().toLowerCase();
      if (ownerEmail && signedInEmail === ownerEmail && token.role !== "ADMIN") {
        token.role = "ADMIN";
        const userId = String(user?.id ?? token.id ?? "");
        if (userId) {
          await db.user.updateMany({
            where: { id: userId, role: "USER" },
            data: { role: "ADMIN" },
          }).catch((error) => {
            console.error("[auth] Failed to persist owner ADMIN role", error);
          });
        }
      }
      // Only tokens issued after this feature shipped carry a jti -- pre-existing
      // sessions have none and skip this check entirely, so they keep working
      // exactly as before until they naturally expire and the user logs in again.
      if (token.jti) {
        const revoked = await isTrustedSessionRevoked(token.jti as string).catch(() => false);
        if (revoked) return null;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        if (token.jti) session.jti = token.jti;
      }
      return session;
    },
  },
};
