// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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
