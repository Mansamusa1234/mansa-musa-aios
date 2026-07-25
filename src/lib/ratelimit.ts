import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = createRedis();

function makeLimiter(
  requests: number,
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`,
  prefix: string,
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix,
  });
}

// Per-route limiters — null when Upstash env vars are absent (skips limiting)
export const limiters = {
  /** 30 requests / minute — authenticated, keyed by user ID */
  chat:     makeLimiter(30, "1 m", "rl:chat"),
  /** 5 requests / hour — unauthenticated, keyed by IP */
  register: makeLimiter(5,  "1 h", "rl:register"),
  /** 10 requests / hour — authenticated, keyed by user ID */
  checkout: makeLimiter(10, "1 h", "rl:checkout"),
  /** 60 requests / minute — authenticated admin, keyed by user ID */
  admin:    makeLimiter(60, "1 m", "rl:admin"),
  /** 10 sessions / day — authenticated, keyed by user ID (each session runs ~20 LLM calls) */
  arena:    makeLimiter(10, "1 d", "rl:arena"),
  /** 8 attempts / 5 minutes — unauthenticated, keyed by IP */
  login:              makeLimiter(8, "5 m", "rl:login"),
  /** 3 requests / hour — unauthenticated, keyed by IP */
  forgotPassword:     makeLimiter(3, "1 h", "rl:forgot-password"),
  /** 3 requests / hour — keyed by user ID or IP */
  resendVerification: makeLimiter(3, "1 h", "rl:resend-verification"),
  /** 20 requests / minute — authenticated, keyed by user ID (Quiver API rate limits) */
  quiver: makeLimiter(20, "1 m", "rl:quiver"),
};

/**
 * Check a rate limit and return a 429 NextResponse if exceeded, or null if allowed.
 * Fails open on Redis errors so a Redis outage never blocks legitimate traffic.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<NextResponse | null> {
  if (!limiter) return null;
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }
  } catch (err) {
    console.error("[ratelimit] Redis error, failing open:", err);
  }
  return null;
}

/** Extract the client IP from Vercel / proxy forwarding headers. */
export function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}
