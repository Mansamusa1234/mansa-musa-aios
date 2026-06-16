import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import PortalContent from "./PortalContent";

export const metadata: Metadata = {
  title: "Customer Portal | MansaMusaAI",
  description: "Manage your subscription, view usage, and access billing history.",
};

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await auth();
  const userId  = session!.user.id;

  const [subscription, totalMessages, totalConversations] = await Promise.all([
    db.subscription.findUnique({ where: { userId } }),
    db.message.count({ where: { conversation: { userId } } }),
    db.conversation.count({ where: { userId } }),
  ]);

  const currentPlan = PLANS.find((p) => p.priceId === subscription?.stripePriceId) ?? PLANS[0];

  const messagesThisMonth = await db.message.count({
    where: {
      conversation: { userId },
      createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
  });

  return (
    <PortalContent
      user={{ name: session!.user.name ?? null, email: session!.user.email ?? null }}
      subscription={subscription}
      plan={currentPlan}
      totalMessages={totalMessages}
      totalConversations={totalConversations}
      messagesThisMonth={messagesThisMonth}
    />
  );
}
