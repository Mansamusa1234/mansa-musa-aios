import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | MansaMusaAI",
  description: "Your MansaMusaAI command centre — analytics, agents, and AI-powered insights.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [conversations, subscription, user, msgThisMonth] = await Promise.all([
    db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { messages: true } } },
    }),
    db.subscription.findUnique({ where: { userId } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true, createdAt: true, emailVerified: true, twoFactorEnabled: true, onboardingComplete: true } }),
    db.usageRecord.count({ where: { userId, createdAt: { gte: monthStart } } }),
  ]);

  let planId = "free";
  if (subscription?.status === "ACTIVE" && subscription.stripePriceId) {
    if (subscription.stripePriceId === process.env.STRIPE_PRICE_ENTERPRISE) planId = "enterprise";
    else if (subscription.stripePriceId === process.env.STRIPE_PRICE_PRO) planId = "pro";
    else if (subscription.stripePriceId === process.env.STRIPE_PRICE_BASIC) planId = "basic";
  }
  const planDef = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  const onboardingItems = [
    { id: "chat", label: "Start your first AI conversation", description: "Chat with Claude — your AI assistant", href: "/chat", cta: "Chat now", done: conversations.length > 0 },
    { id: "marketplace", label: "Explore the agent marketplace", description: "Browse 41 specialised AI agents", href: "/marketplace", cta: "Explore", done: false },
    { id: "verify", label: "Verify your email", description: "Confirm your email address for security", href: "/settings", cta: "Settings", done: !!user?.emailVerified },
    { id: "2fa", label: "Enable two-factor authentication", description: "Secure your account with 2FA", href: "/settings", cta: "Enable", done: !!user?.twoFactorEnabled },
    { id: "upgrade", label: "Upgrade your plan", description: "Unlock unlimited messages and more", href: "/billing", cta: "View plans", done: planId !== "free" },
  ];
  const completedOnboardingItems = onboardingItems.filter((item) => item.done).length;
  const onboardingProgress = onboardingItems.length > 0 ? completedOnboardingItems / onboardingItems.length : 1;
  const isRecentlyRegistered = user?.createdAt ? Date.now() - user.createdAt.getTime() < 24 * 60 * 60 * 1000 : false;
  const shouldShowFirstWelcome = isRecentlyRegistered || onboardingProgress === 0;

  return (
    <DashboardClient
      userName={(user?.name ?? session!.user.name)?.split(" ")[0] ?? "there"}
      conversations={conversations}
      plan={planDef.name}
      status={subscription?.status ?? "Inactive"}
      totalConversations={conversations.length}
      onboardingItems={onboardingItems}
      onboardingComplete={!!user?.onboardingComplete}
      showFirstWelcome={shouldShowFirstWelcome}
      msgUsed={msgThisMonth}
      msgLimit={planDef.messagesPerMonth === Infinity ? null : planDef.messagesPerMonth}
    />
  );
}
