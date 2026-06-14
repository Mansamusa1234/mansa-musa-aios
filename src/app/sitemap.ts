import type { MetadataRoute } from "next";

const BASE = "https://mansamusaai.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE,                  lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/agents`,      lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/features`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/pricing`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`,        lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/about`,       lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`,     lastModified: now, changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/register`,    lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/login`,       lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
