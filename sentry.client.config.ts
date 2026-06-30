// This file configures the initialization of Sentry on the client/browser.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No-op cleanly if the DSN isn't configured (e.g. local dev, preview builds
// without Sentry set up) — never throw during build or runtime.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}
