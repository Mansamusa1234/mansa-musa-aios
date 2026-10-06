import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePlan } from "@/lib/subscription";
import { MODEL_CATALOG, planRank } from "@/lib/modelRouter";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pref = await db.userModelPreference.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ preference: pref ?? { mode: "auto", provider: "anthropic", modelId: "claude-haiku-4-5-20251001" } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mode, provider, modelId } = await req.json();
  if (!["auto", "manual"].includes(mode)) return NextResponse.json({ error: "Missing mode" }, { status: 400 });

  if (mode === "manual") {
    const model = MODEL_CATALOG.find((m) => m.provider === provider && m.modelId === modelId);
    if (!model) return NextResponse.json({ error: "Unknown model" }, { status: 400 });
    const plan = await getActivePlan(session.user.id);
    if (planRank(plan) < planRank(model.planGate)) return NextResponse.json({ error: "This model requires an upgraded plan." }, { status: 403 });
    if (!model.available()) return NextResponse.json({ error: "This provider is not configured." }, { status: 503 });
  }

  const pref = await db.userModelPreference.upsert({
    where: { userId: session.user.id },
    update: { mode, provider: provider ?? "anthropic", modelId: modelId ?? "claude-haiku-4-5-20251001" },
    create: { userId: session.user.id, mode, provider: provider ?? "anthropic", modelId: modelId ?? "claude-haiku-4-5-20251001" },
  });

  return NextResponse.json({ preference: pref });
}
