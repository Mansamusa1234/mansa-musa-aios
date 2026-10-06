import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CONNECTORS } from "@/lib/connectors";
import { checkRateLimit, limiters } from "@/lib/ratelimit";

export async function POST(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;
  const { key } = await params;
  const connector = CONNECTORS.find((item) => item.key === key);
  if (!connector) return NextResponse.json({ ok: false, summary: "Unknown connector." }, { status: 404 });
  if (!connector.isConfigured()) return NextResponse.json({ ok: false, summary: connector.notConfiguredReason ?? "Credentials are missing." });
  try {
    return NextResponse.json(await connector.fetchSample());
  } catch {
    return NextResponse.json({ ok: false, summary: "Connection failed. Check credentials and provider availability." }, { status: 502 });
  }
}
