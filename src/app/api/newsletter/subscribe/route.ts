import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.forgotPassword, getIP(req));
  if (limited) return limited;

  try {
    const { email } = schema.parse(await req.json());
    const session = await auth();

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === "UNSUBSCRIBED") {
        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { status: "SUBSCRIBED", subscribedAt: new Date(), unsubscribedAt: null },
        });
      }
      return NextResponse.json({ message: "You're subscribed!" });
    }

    await db.newsletterSubscriber.create({
      data: {
        email,
        userId: session?.user?.id ?? null,
        unsubscribeToken: crypto.randomBytes(24).toString("hex"),
      },
    });

    return NextResponse.json({ message: "You're subscribed!" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[newsletter/subscribe]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
