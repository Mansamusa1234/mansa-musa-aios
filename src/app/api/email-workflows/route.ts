import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const stepSchema = z.object({
  stepOrder:  z.number().int().min(0),
  delayHours: z.number().int().min(0),
  subject:    z.string().min(1).max(200),
  bodyHtml:   z.string().min(1),
});

const schema = z.object({
  name:     z.string().min(1).max(120),
  trigger:  z.enum(["LEAD_CREATED","BOOKING_CONFIRMED","BOOKING_CANCELLED","TRIAL_STARTED","TRIAL_ENDING","SUBSCRIPTION_ACTIVATED","SUBSCRIPTION_CANCELLED","MANUAL"]),
  isActive: z.boolean().optional().default(true),
  steps:    z.array(stepSchema).min(1).max(10),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await db.emailWorkflow.findMany({
    where: { userId: session.user.id },
    include: { steps: { orderBy: { stepOrder: "asc" } }, _count: { select: { runs: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ workflows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 422 });

  const { name, trigger, isActive, steps } = parsed.data;

  const workflow = await db.emailWorkflow.create({
    data: {
      userId: session.user.id,
      name,
      trigger,
      isActive,
      steps: { create: steps },
    },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
