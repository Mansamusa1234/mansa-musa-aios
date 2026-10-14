import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("@/lib/envValidator");
    assertEnv();
    // Sentry 10 on Next 15 initialises server and edge monitoring from here, not automatically.
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Reports errors thrown while rendering server components and route handlers.
export const onRequestError = Sentry.captureRequestError;
