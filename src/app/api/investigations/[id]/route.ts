import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim"), statement: z.string().trim().min(8).max(4000) }),
  z.object({
    action: z.literal("source"), title: z.string().trim().min(3).max(240),
    url: z.string().trim().url().max(2000).refine((url) => url.startsWith("https://"), "Use an HTTPS link."),
    publisher: z.string().trim().max(160).optional(),
    sourceType: z.enum(["PRIMARY", "SECONDARY", "OTHER"]),
    publishedAt: z.string().date().optional().or(z.literal("")),
    excerpt: z.string().trim().max(6000).optional(),
    notes: z.string().trim().max(4000).optional(),
  }),
  z.object({
    action: z.literal("link"), claimId: z.string().min(1), sourceId: z.string().min(1),
    stance: z.enum(["SUPPORTS", "CHALLENGES", "CONTEXT"]),
    rationale: z.string().trim().max(2000).optional(),
  }),
  z.object({
    action: z.literal("review"), claimId: z.string().min(1),
    status: z.enum(["CONFIRMED", "DOCUMENTED_ALLEGATION", "CIRCUMSTANTIAL", "UNRESOLVED", "CONTRADICTED"]),
    assessment: z.string().trim().min(12).max(6000),
  }),
]);

type Context = { params: Promise<{ id: string }> };

async function ownedInvestigation(userId: string, id: string) {
  return db.investigation.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function GET(_req: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  try {
    const investigation = await db.investigation.findFirst({
      where: { id, userId: session.user.id },
      include: {
        claims: { orderBy: { createdAt: "asc" }, include: { sources: true, reviews: { orderBy: { reviewedAt: "desc" }, take: 5 } } },
        sources: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!investigation) return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
    return NextResponse.json({ investigation });
  } catch (error) {
    console.error("[investigations] detail failed", error);
    return NextResponse.json({ error: "Research records are unavailable. Apply the database schema first." }, { status: 503 });
  }
}

export async function POST(req: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const parsed = action.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  try {
    if (!await ownedInvestigation(session.user.id, id)) return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
    const data = parsed.data;
    if (data.action === "claim") {
      const claim = await db.researchClaim.create({ data: { investigationId: id, statement: data.statement } });
      return NextResponse.json({ claim }, { status: 201 });
    }
    if (data.action === "source") {
      const source = await db.researchSource.create({
        data: {
          investigationId: id, title: data.title, url: data.url, publisher: data.publisher,
          sourceType: data.sourceType, publishedAt: data.publishedAt ? new Date(`${data.publishedAt}T00:00:00.000Z`) : null,
          excerpt: data.excerpt, notes: data.notes,
        },
      });
      return NextResponse.json({ source }, { status: 201 });
    }
    const claim = await db.researchClaim.findFirst({ where: { id: data.claimId, investigationId: id } });
    if (!claim) return NextResponse.json({ error: "Claim not found in this investigation" }, { status: 404 });
    if (data.action === "link") {
      const source = await db.researchSource.findFirst({ where: { id: data.sourceId, investigationId: id } });
      if (!source) return NextResponse.json({ error: "Source not found in this investigation" }, { status: 404 });
      await db.$transaction(async (tx) => {
        await tx.claimSourceLink.upsert({
          where: { claimId_sourceId: { claimId: claim.id, sourceId: source.id } },
          create: { claimId: claim.id, sourceId: source.id, stance: data.stance, rationale: data.rationale },
          update: { stance: data.stance, rationale: data.rationale },
        });
        if (claim.status !== "UNASSESSED") {
          await tx.researchClaim.update({ where: { id: claim.id }, data: { status: "UNASSESSED", assessment: null, reviewedAt: null } });
          await tx.claimReviewEvent.create({ data: { claimId: claim.id, status: "UNASSESSED", assessment: "Source relationship changed. Previous assessment requires a new review." } });
        }
      });
      return NextResponse.json({ ok: true });
    }
    const links = await db.claimSourceLink.findMany({ where: { claimId: claim.id }, include: { source: true } });
    if (data.status === "CONFIRMED" && !links.some((link) => link.stance === "SUPPORTS" && link.source.sourceType === "PRIMARY")) {
      return NextResponse.json({ error: "A confirmed assessment needs a linked primary source marked Supports." }, { status: 400 });
    }
    if (data.status === "CONTRADICTED" && !links.some((link) => link.stance === "CHALLENGES")) {
      return NextResponse.json({ error: "A contradicted assessment needs a linked source marked Challenges." }, { status: 400 });
    }
    await db.$transaction([
      db.researchClaim.update({ where: { id: claim.id }, data: { status: data.status, assessment: data.assessment, reviewedAt: new Date() } }),
      db.claimReviewEvent.create({ data: { claimId: claim.id, status: data.status, assessment: data.assessment } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[investigations] update failed", error);
    return NextResponse.json({ error: "Could not save the research record." }, { status: 503 });
  }
}
