import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/chat", "/billing", "/admin", "/api"],
      },
    ],
    sitemap: "https://mansamusaai.vercel.app/sitemap.xml",
  };
}
