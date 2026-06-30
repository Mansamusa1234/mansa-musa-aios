import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Lightweight health check — confirms the app is up and the DB is reachable.
// Used by uptime monitors / load balancers. Keep this fast and dependency-light.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
