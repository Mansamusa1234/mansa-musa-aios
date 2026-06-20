import { NextResponse } from "next/server";

// Category mapping from RSS feed topics
const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",  category: "Business" },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", category: "Tech"     },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml",      category: "Global"   },
];

interface Article {
  id: number;
  category: string;
  source: string;
  time: string;
  headline: string;
  excerpt: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  readTime: string;
  featured?: boolean;
  url?: string;
}

let cache: { articles: Article[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function inferSentiment(text: string): "Positive" | "Neutral" | "Negative" {
  const lower = text.toLowerCase();
  const pos = ["rise", "gain", "surge", "record", "growth", "beat", "profit", "boost", "soar", "win", "success", "expand", "jump", "high", "strong"];
  const neg = ["fall", "drop", "loss", "crash", "decline", "cut", "lay", "bankrupt", "warn", "slump", "plunge", "concern", "risk", "slow", "miss"];
  const posScore = pos.filter((w) => lower.includes(w)).length;
  const negScore = neg.filter((w) => lower.includes(w)).length;
  if (posScore > negScore) return "Positive";
  if (negScore > posScore) return "Negative";
  return "Neutral";
}

function relativeTime(pubDate: string): string {
  const diff = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

async function parseFeed(url: string, category: string): Promise<Omit<Article, "id" | "featured">[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 600 } });
    clearTimeout(timer);
    if (!res.ok) return [];
    const xml = await res.text();

    const items: Omit<Article, "id" | "featured">[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const block = match[1];
      const title   = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
      const desc    = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] ?? block.match(/<description>(.*?)<\/description>/)?.[1] ?? "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
      const link    = block.match(/<link>(.*?)<\/link>|<link\/>/)?.[1] ?? block.match(/<link \/>/)?.[0] ?? "";

      const cleanTitle = title.replace(/<[^>]+>/g, "").trim();
      const cleanDesc  = desc.replace(/<[^>]+>/g, "").trim().slice(0, 220);
      if (!cleanTitle) continue;

      const wc = wordCount(cleanTitle + " " + cleanDesc);
      items.push({
        category,
        source: "BBC News",
        time: pubDate ? relativeTime(pubDate) : "recently",
        headline: cleanTitle,
        excerpt: cleanDesc || cleanTitle,
        sentiment: inferSentiment(cleanTitle + " " + cleanDesc),
        readTime: `${Math.max(1, Math.ceil(wc / 200))} min`,
        url: link.trim() || undefined,
      });
    }
    return items.slice(0, 8);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ articles: cache.articles, source: "cache" });
  }

  const results = await Promise.all(RSS_FEEDS.map((f) => parseFeed(f.url, f.category)));
  const all = results.flat();

  if (all.length === 0) {
    return NextResponse.json({ articles: [], source: "empty" });
  }

  const articles: Article[] = all
    .sort(() => Math.random() - 0.5)
    .map((a, i) => ({ ...a, id: i + 1, featured: i === 0 }));

  cache = { articles, fetchedAt: Date.now() };
  return NextResponse.json({ articles, source: "rss" });
}
