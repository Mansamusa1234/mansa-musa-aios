import type { MetadataRoute } from "next";

const BASE = "https://www.mansamusainitiative.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE,                         lastModified: now, changeFrequency: "weekly",  priority: 1.0  },
    { url: `${BASE}/launch`,             lastModified: now, changeFrequency: "weekly",  priority: 1.0  },
    { url: `${BASE}/wisdom-arena`,       lastModified: now, changeFrequency: "weekly",  priority: 0.95 },
    { url: `${BASE}/agents`,             lastModified: now, changeFrequency: "weekly",  priority: 0.92 },
    { url: `${BASE}/features`,           lastModified: now, changeFrequency: "monthly", priority: 0.9  },
    { url: `${BASE}/pricing`,            lastModified: now, changeFrequency: "monthly", priority: 0.88 },
    { url: `${BASE}/affiliate`,          lastModified: now, changeFrequency: "monthly", priority: 0.8  },
    { url: `${BASE}/blog`,               lastModified: now, changeFrequency: "weekly",  priority: 0.75 },
    { url: `${BASE}/about`,              lastModified: now, changeFrequency: "monthly", priority: 0.6  },
    { url: `${BASE}/contact`,            lastModified: now, changeFrequency: "yearly",  priority: 0.5  },
    { url: `${BASE}/register`,           lastModified: now, changeFrequency: "yearly",  priority: 0.45 },
    { url: `${BASE}/login`,              lastModified: now, changeFrequency: "yearly",  priority: 0.3  },
  ];
}
