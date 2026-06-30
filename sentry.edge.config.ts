// This file configures the initialization of Sentry for edge features
// (middleware, edge routes, etc).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

// No-op cleanly if the DSN isn't configured — never throw during build or runtime.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}
