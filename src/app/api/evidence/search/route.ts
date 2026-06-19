import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchEvidenceChunks } from "@/lib/evidenceVault";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const sources = await searchEvidenceChunks(session.user.id, q, 10);

  return NextResponse.json({ query: q, sources });
}
