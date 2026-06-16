import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const subscriber = await db.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (subscriber && subscriber.status === "SUBSCRIBED") {
    await db.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center">
      <h2>You've been unsubscribed</h2>
      <p style="color:#666">You won't receive any more newsletter emails from MansaMusaAI.</p>
      <a href="/" style="color:#6366f1">Return to MansaMusaAI</a>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
