import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",   value: "on" },
  { key: "X-Frame-Options",          value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://app.posthog.com https://eu.posthog.com https://cdn.mxpnl.com https://connect.facebook.net https://analytics.tiktok.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://www.googletagmanager.com",
      "font-src 'self'",
      "connect-src 'self' https://api.anthropic.com https://api.openai.com https://openrouter.ai https://api.stripe.com https://app.posthog.com https://eu.posthog.com https://api.mixpanel.com https://www.google-analytics.com https://stats.g.doubleclick.net https://www.clarity.ms wss:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // www.mansamusainitiative.com is the Vercel primary domain (apex 308s to www at Vercel edge).
    // Keep www as canonical here to match that — do NOT redirect www or the loop re-forms.
    const PRIMARY = "https://www.mansamusainitiative.com";
    const nonPrimaryHosts = [
      "mansamusaai.vercel.app",
      "app.mansamusainitiative.com",
      "mansamusainitiative.co.uk",
      "www.mansamusainitiative.co.uk",
    ];
    return nonPrimaryHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host", value: host }],
      destination: `${PRIMARY}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
