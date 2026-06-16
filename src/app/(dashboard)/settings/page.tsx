import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import SettingsContent from "./SettingsContent";

export const metadata: Metadata = {
  title: "Settings | MansaMusaAI",
  description: "Manage your profile, password, email, and active sessions.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";
  const sessionToken = cookieStore.get(cookieName)?.value;
  const decoded = sessionToken
    ? await decode({ token: sessionToken, secret: process.env.NEXTAUTH_SECRET!, salt: cookieName })
    : null;
  const currentJti = (decoded as { jti?: string } | null)?.jti;

  const [user, sessions] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true, emailVerified: true } }),
    db.trustedSession.findMany({ where: { userId, revokedAt: null }, orderBy: { lastSeenAt: "desc" } }),
  ]);

  return (
    <SettingsContent
      name={user?.name ?? ""}
      email={user?.email ?? ""}
      emailVerified={!!user?.emailVerified}
      sessions={sessions.map((s) => ({
        id: s.id,
        ip: s.ip,
        userAgent: s.userAgent,
        rememberMe: s.rememberMe,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        isCurrent: !!currentJti && s.tokenId === currentJti,
      }))}
    />
  );
}
