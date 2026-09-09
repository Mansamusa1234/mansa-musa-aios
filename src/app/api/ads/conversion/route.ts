import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAttributionEvent } from "@/lib/ads/store";

const eventSchema = z.object({
  eventType: z.enum(["PAGE_VIEW", "LEAD", "SIGNUP", "PURCHASE", "OTHER"]),
  campaignExternalId: z.string().max(250).optional().nullable(),
  platform: z.enum(["META", "GOOGLE", "TIKTOK"]).optional().nullable(),
  amountCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  email: z.string().email().optional().nullable(),
  name: z.string().max(200).optional(),
  phone: z.string().max(80).optional(),
  externalEventId: z.string().max(250).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const expectedSecret = process.env.ADS_CONVERSION_SECRET;
  const suppliedSecret = req.headers.get("x-mansa-conversion-secret");
  const userId = session?.user?.id || process.env.ADS_OWNER_USER_ID;

  if (!userId) return NextResponse.json({ error: "No attribution owner configured" }, { status: 503 });
  if (!session?.user?.id && expectedSecret && suppliedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = eventSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const event = await createAttributionEvent(userId, parsed.data);

  if (parsed.data.eventType === "LEAD" && (parsed.data.email || parsed.data.phone)) {
    await db.lead.create({
      data: {
        userId,
        name: parsed.data.name || parsed.data.email || parsed.data.phone || "Paid ads lead",
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        source: [parsed.data.platform, parsed.data.campaignExternalId].filter(Boolean).join(":") || "PAID_ADS",
        value: Math.round((parsed.data.amountCents ?? 0) / 100),
        notes: `Captured by Paid Ads Growth Agent${parsed.data.campaignExternalId ? ` from campaign ${parsed.data.campaignExternalId}` : ""}.`,
      },
    });
  }

  return NextResponse.json({ ok: true, event }, { status: 201 });
}
