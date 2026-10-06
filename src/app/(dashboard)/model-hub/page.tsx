import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActivePlan } from "@/lib/subscription";
import { MODEL_CATALOG, getAutoModel } from "@/lib/modelRouter";
import ModelHubContent from "./ModelHubContent";

export const metadata: Metadata = { title: "Model Hub | MansaMusaAI" };
export const dynamic = "force-dynamic";

export default async function ModelHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activePlan = await getActivePlan(session.user.id);
  const plan = activePlan === "starter" ? "basic" : activePlan;
  let autoModelKey: string | null = null;
  try { const model = getAutoModel(plan); autoModelKey = `${model.provider}:${model.modelId}`; } catch { /* Catalog will show missing credentials. */ }

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
      autoModelKey={autoModelKey}
      plan={plan}
      preference={pref ? { mode: pref.mode, provider: pref.provider, modelId: pref.modelId } : { mode: "auto", provider: "anthropic", modelId: "claude-haiku-4-5-20251001" }}
    />
  );
}
