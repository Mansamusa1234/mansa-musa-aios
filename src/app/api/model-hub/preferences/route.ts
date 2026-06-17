import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MODEL_CATALOG } from "@/lib/modelRouter";
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
  if (!mode) return NextResponse.json({ error: "Missing mode" }, { status: 400 });

  if (mode === "manual") {
    const model = MODEL_CATALOG.find((m) => m.provider === provider && m.modelId === modelId);
    if (!model) return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  }

  const pref = await db.userModelPreference.upsert({
    where: { userId: session.user.id },
    update: { mode, provider: provider ?? "anthropic", modelId: modelId ?? "claude-haiku-4-5-20251001" },
    create: { userId: session.user.id, mode, provider: provider ?? "anthropic", modelId: modelId ?? "claude-haiku-4-5-20251001" },
  });

  return NextResponse.json({ preference: pref });
}
