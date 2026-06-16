import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { CONNECTORS } from "@/lib/connectors";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;

  const { key } = await params;
  const connector = CONNECTORS.find((c) => c.key === key);
  if (!connector) {
    return NextResponse.json({ error: "Unknown connector" }, { status: 404 });
  }
  if (!connector.isConfigured()) {
    return NextResponse.json({ ok: false, summary: connector.notConfiguredReason ?? "Not configured." });
  }

  try {
    const result = await connector.fetchSample();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ ok: false, summary: err instanceof Error ? err.message : String(err) });
  }
}
