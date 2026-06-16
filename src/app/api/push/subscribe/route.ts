import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json();
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  await db.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
