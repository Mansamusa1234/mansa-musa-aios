import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      summary: "Connector tests are temporarily disabled for deployment.",
    },
    { status: 503 }
  );
}
