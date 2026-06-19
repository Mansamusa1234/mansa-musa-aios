import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePlan, hasFeature } from "@/lib/subscription";
import { renderLetterExport } from "@/lib/exportTemplates";

const schema = z.object({
  title: z.string().min(2).max(160),
  question: z.string().min(2).max(5000),
  answer: z.string().min(2).max(30000),
  sources: z.array(z.string().max(1000)).max(40).optional(),
});

function safeFilename(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "mansa-export";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getActivePlan(session.user.id);
  if (!hasFeature(plan, "export_letter_pack")) {
    return NextResponse.json({ error: "Export Letter Pack requires Starter or higher." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid export request." }, { status: 400 });
  }

  const content = renderLetterExport(parsed.data);
  await db.exportedDocument.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title,
        type: "LETTER_PACK",
        content,
        sources: parsed.data.sources ? JSON.stringify(parsed.data.sources) : null,
      },
    })
    .catch((err) => {
      console.error("[export] could not persist export history:", err);
    });

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename(parsed.data.title)}.txt"`,
    },
  });
}
