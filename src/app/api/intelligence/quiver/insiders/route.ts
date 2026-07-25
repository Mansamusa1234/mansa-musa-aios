import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { getActivePlan, hasFeature } from "@/lib/subscription";
import { getInsiderTransactions } from "@/lib/quiver/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.quiver, session.user.id);
  if (limited) return limited;

  const plan = await getActivePlan(session.user.id);
  if (!hasFeature(plan, "quiver_intel"))
    return NextResponse.json({ error: "Upgrade to Starter or above to access Market Intelligence." }, { status: 403 });

  const ticker = new URL(req.url).searchParams.get("ticker") ?? undefined;

  try {
    const data = await getInsiderTransactions(ticker);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[quiver/insiders]", err);
    return NextResponse.json({ error: "Failed to fetch insider transaction data." }, { status: 502 });
  }
}
