import { NextResponse } from "next/server";
import { processDeferredSteps } from "@/lib/email-automation";

// Called by a cron job (e.g. Vercel Cron or external scheduler) every 15 minutes.
// Protect with a secret header so only the scheduler can trigger it.
export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await processDeferredSteps();
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
