import { isTrustedSessionRevoked } from "@/lib/sessionSecurity";

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
