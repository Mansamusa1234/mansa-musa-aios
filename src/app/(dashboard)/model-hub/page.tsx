import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MODEL_CATALOG } from "@/lib/modelRouter";
import ModelHubContent from "./ModelHubContent";

export const metadata: Metadata = { title: "Model Hub | MansaMusaAI" };
export const dynamic = "force-dynamic";

export default async function ModelHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const subscription = await db.subscription.findUnique({ where: { userId: session.user.id } });
  let plan = "free";
  if (subscription?.status === "ACTIVE" && subscription.stripePriceId) {
    if (subscription.stripePriceId === process.env.STRIPE_PRICE_ENTERPRISE) plan = "enterprise";
    else if (subscription.stripePriceId === process.env.STRIPE_PRICE_PRO) plan = "pro";
    else if (subscription.stripePriceId === process.env.STRIPE_PRICE_BASIC) plan = "basic";
  }

  const pref = await db.userModelPreference.findUnique({ where: { userId: session.user.id } });

  const PLAN_ORDER = ["free", "basic", "pro", "enterprise"];
  const planRank = (p: string) => PLAN_ORDER.indexOf(p);

  const catalog = MODEL_CATALOG.map((m) => ({
    provider: m.provider,
    modelId: m.modelId,
    displayName: m.displayName,
    description: m.description,
    planGate: m.planGate,
    contextWindow: m.contextWindow,
    costPer1kInMicro: m.costPer1kInMicro,
    costPer1kOutMicro: m.costPer1kOutMicro,
    badge: m.badge ?? null,
    unlocked: planRank(plan) >= planRank(m.planGate),
    available: m.available(),
  }));

  return (
    <ModelHubContent
      catalog={catalog}
      plan={plan}
      preference={pref ? { mode: pref.mode, provider: pref.provider, modelId: pref.modelId } : { mode: "auto", provider: "anthropic", modelId: "claude-haiku-4-5-20251001" }}
    />
  );
}
