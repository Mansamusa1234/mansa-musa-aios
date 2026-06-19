import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  name:     z.string().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

async function getOwned(id: string, userId: string) {
  return db.emailWorkflow.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const wf = await db.emailWorkflow.findFirst({
    where: { id, userId: session.user.id },
    include: { steps: { orderBy: { stepOrder: "asc" } }, runs: { orderBy: { startedAt: "desc" }, take: 20 } },
  });
  if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ workflow: wf });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!await getOwned(id, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 422 });

  const updated = await db.emailWorkflow.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ workflow: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!await getOwned(id, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.emailWorkflow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
