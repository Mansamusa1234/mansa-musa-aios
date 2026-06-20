import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, url } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "title and body are required" }, { status: 400 });

  const result = await sendPushNotification({ title, body, url }, session.user.id);
  return NextResponse.json({ ok: true, ...result });
}
