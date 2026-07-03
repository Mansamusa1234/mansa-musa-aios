import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",              value: "on" },
  { key: "X-Frame-Options",                     value: "DENY" },
  { key: "X-Content-Type-Options",              value: "nosniff" },
  { key: "X-Permitted-Cross-Domain-Policies",   value: "none" },
  { key: "Referrer-Policy",                     value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",                  value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy",          value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy",        value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy",        value: "unsafe-none" }, // allows Stripe iframes
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' required by Next.js dev mode + some analytics; 'unsafe-inline' required by Tailwind + analytics tags
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://app.posthog.com https://eu.posthog.com https://cdn.mxpnl.com https://connect.facebook.net https://analytics.tiktok.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://www.googletagmanager.com https://i.ytimg.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.anthropic.com https://api.openai.com https://openrouter.ai https://api.stripe.com https://app.posthog.com https://eu.posthog.com https://api.mixpanel.com https://www.google-analytics.com https://stats.g.doubleclick.net https://www.clarity.ms https://o*.ingest.sentry.io wss:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  compress: true,
  poweredByHeader: false,
  experimental: {
    // Tree-shake these large packages — only import what's used
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
