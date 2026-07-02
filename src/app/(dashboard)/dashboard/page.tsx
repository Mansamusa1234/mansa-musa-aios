import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import DashboardClient from "@/components/dashboard/DashboardClient";
import OnboardingAgent from "@/components/onboarding/OnboardingAgent";

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

  const [conversations, subscription, user, msgThisMonth, receptionist, calendarAvail] = await Promise.all([
    db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { messages: true } } },
    }),
    db.subscription.findUnique({ where: { userId } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true, createdAt: true, emailVerified: true, twoFactorEnabled: true, onboardingComplete: true } }),
    db.usageRecord.count({ where: { userId, createdAt: { gte: monthStart } } }),
    db.receptionist.findUnique({ where: { userId }, select: { id: true } }),
    db.calendarAvailability.findUnique({ where: { userId }, select: { id: true } }),
  ]);

  let planId = "free";
  if ((subscription?.status === "ACTIVE" || subscription?.status === "TRIALING") && subscription.stripePriceId) {
    if (subscription.stripePriceId === process.env.STRIPE_PRICE_ENTERPRISE) planId = "enterprise";
    else if (subscription.stripePriceId === (process.env.STRIPE_PRICE_PROFESSIONAL ?? process.env.STRIPE_PRICE_PRO)) planId = "professional";
    else if (subscription.stripePriceId === (process.env.STRIPE_PRICE_STARTER ?? process.env.STRIPE_PRICE_BASIC)) planId = "starter";
  }
  const planDef = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  const onboardingItems = [
    { id: "receptionist", label: "Set up your AI receptionist", description: "Configure name, greeting, and persona", href: "/receptionist", cta: "Set up", done: !!receptionist },
    { id: "calendar", label: "Set your availability", description: "Let AI book appointments for you", href: "/calendar", cta: "Set hours", done: !!calendarAvail },
    { id: "verify", label: "Verify your email", description: "Confirm your email address for security", href: "/settings", cta: "Settings", done: !!user?.emailVerified },
    { id: "2fa", label: "Enable two-factor authentication", description: "Secure your account with 2FA", href: "/settings", cta: "Enable", done: !!user?.twoFactorEnabled },
    { id: "upgrade", label: "Upgrade your plan", description: "Starter £49 · Professional £149 · Enterprise £499", href: "/billing", cta: "View plans", done: planId !== "free" },
  ];
  const completedOnboardingItems = onboardingItems.filter((item) => item.done).length;
  const onboardingProgress = onboardingItems.length > 0 ? completedOnboardingItems / onboardingItems.length : 1;
  const isRecentlyRegistered = user?.createdAt ? Date.now() - user.createdAt.getTime() < 24 * 60 * 60 * 1000 : false;
  const shouldShowFirstWelcome = isRecentlyRegistered || onboardingProgress === 0;

  return (
    <>
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
      <OnboardingAgent
        userName={user?.name ?? session!.user.name ?? ""}
        isNewUser={shouldShowFirstWelcome}
      />
    </>
  );
}
