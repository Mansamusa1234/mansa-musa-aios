import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { sendPushNotification, isPushConfigured } from "@/lib/push";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;

  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured (missing VAPID keys)." }, { status: 503 });
  }

  const { title, body, url } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  }

  const result = await sendPushNotification({ title, body, url });
  return NextResponse.json({ success: true, ...result });
}
