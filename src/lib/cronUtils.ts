import { NextResponse } from "next/server";

/** Validates the cron secret and wraps the handler in a try/catch. Returns JSON on all outcomes. */
export function withCron(
  handler: (req: Request) => Promise<Record<string, unknown>>
) {
  return async function (req: Request): Promise<NextResponse> {
    const secret = req.headers.get("authorization");
    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const result = await handler(req);
      return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron] unhandled error:`, message, err);
      return NextResponse.json({ ok: false, error: message, timestamp: new Date().toISOString() }, { status: 500 });
    }
  };
}

/** Retry an async operation up to maxAttempts times with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastErr;
}
