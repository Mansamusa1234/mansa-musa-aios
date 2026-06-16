import { XMLParser } from "fast-xml-parser";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { anthropic } from "@/lib/anthropic";

export interface ConnectorResult {
  ok: boolean;
  summary: string;
  data?: unknown;
}

export interface Connector {
  key: string;
  name: string;
  category: string;
  description: string;
  isConfigured: () => boolean;
  notConfiguredReason?: string;
  fetchSample: () => Promise<ConnectorResult>;
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const xmlParser = new XMLParser({ ignoreAttributes: false });

export const CONNECTORS: Connector[] = [
  {
    key: "web-search",
    name: "Web Search Connector",
    category: "Research",
    description: "Live web search via Claude's built-in web search tool.",
    isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
    fetchSample: async () => {
      try {
        const msg = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content: "What's today's date according to a web search? Answer in one sentence." }],
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 1 } as never],
        });
        const used = msg.content.some((b) => (b.type as string) === "server_tool_use" || (b.type as string) === "web_search_tool_result");
        const text = msg.content.find((b) => b.type === "text");
        return {
          ok: used,
          summary: used
            ? (text && text.type === "text" ? text.text.slice(0, 200) : "Web search tool responded.")
            : "Web search tool not available on this account/SDK version.",
        };
      } catch (err) {
        return { ok: false, summary: `Web search unavailable: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  },
  {
    key: "news-api",
    name: "News Connector",
    category: "Intelligence",
    description: "Real-time news headlines via a third-party news API.",
    isConfigured: () => !!process.env.NEWS_API_KEY,
    notConfiguredReason: "Needs a NEWS_API_KEY (e.g. from newsapi.org) — not yet provided.",
    fetchSample: async () => ({ ok: false, summary: "Not configured — no NEWS_API_KEY set." }),
  },
  {
    key: "financial-market-data",
    name: "Financial Market Data Connector",
    category: "Intelligence",
    description: "Live equity/index prices via a market data API.",
    isConfigured: () => !!process.env.FINANCIAL_DATA_API_KEY,
    notConfiguredReason: "Needs a market data API key (e.g. Alpha Vantage, Twelve Data, Finnhub) — not yet provided.",
    fetchSample: async () => ({ ok: false, summary: "Not configured — no FINANCIAL_DATA_API_KEY set." }),
  },
  {
    key: "crypto-market-data",
    name: "Crypto Market Data Connector",
    category: "Intelligence",
    description: "Live crypto prices via CoinGecko's public API (no key required).",
    isConfigured: () => true,
    fetchSample: async () => {
      const data = await fetchJson(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
      );
      return { ok: true, summary: "Live BTC/ETH prices from CoinGecko.", data };
    },
  },
  {
    key: "stripe",
    name: "Stripe Connector",
    category: "Finance",
    description: "Live billing/revenue data from your own Stripe account.",
    isConfigured: () => !!process.env.STRIPE_SECRET_KEY,
    notConfiguredReason: "Needs STRIPE_SECRET_KEY — not set.",
    fetchSample: async () => {
      const balance = await stripe.balance.retrieve();
      return { ok: true, summary: "Live Stripe balance retrieved.", data: balance };
    },
  },
  {
    key: "supabase-analytics",
    name: "Supabase Internal Analytics Connector",
    category: "Finance",
    description: "Live counts from MansaMusaAI's own Postgres database.",
    isConfigured: () => true,
    fetchSample: async () => {
      const [users, conversations, messages] = await Promise.all([
        db.user.count(),
        db.conversation.count(),
        db.message.count(),
      ]);
      return { ok: true, summary: `${users} users, ${conversations} conversations, ${messages} messages.`, data: { users, conversations, messages } };
    },
  },
  {
    key: "user-documents",
    name: "User Uploaded Documents Connector",
    category: "Research",
    description: "Lets agents read documents a user uploads.",
    isConfigured: () => false,
    notConfiguredReason: "Needs a file storage provider (e.g. Vercel Blob or Supabase Storage) — not yet set up.",
    fetchSample: async () => ({ ok: false, summary: "Not configured — no file storage provider connected." }),
  },
  {
    key: "rss",
    name: "Blog/News RSS Connector",
    category: "Intelligence",
    description: "Parses public RSS feeds (no key required).",
    isConfigured: () => true,
    fetchSample: async () => {
      const res = await fetch("http://feeds.bbci.co.uk/news/business/rss.xml", { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const parsed = xmlParser.parse(xml);
      const items = parsed?.rss?.channel?.item ?? [];
      const headlines = (Array.isArray(items) ? items : [items]).slice(0, 5).map((i: { title?: string }) => i.title);
      return { ok: true, summary: `${headlines.length} headlines from BBC Business RSS.`, data: headlines };
    },
  },
  {
    key: "companies-house",
    name: "Companies House Connector",
    category: "Legal",
    description: "UK company registry lookups via the Companies House public API.",
    isConfigured: () => !!process.env.COMPANIES_HOUSE_API_KEY,
    notConfiguredReason: "Needs a free COMPANIES_HOUSE_API_KEY from developer.company-information.service.gov.uk — not yet provided.",
    fetchSample: async () => ({ ok: false, summary: "Not configured — no COMPANIES_HOUSE_API_KEY set." }),
  },
  {
    key: "gov-uk",
    name: "GOV.UK Public Data Connector",
    category: "Legal",
    description: "Searches GOV.UK's public Search API (no key required).",
    isConfigured: () => true,
    fetchSample: async () => {
      const data = await fetchJson("https://www.gov.uk/api/search.json?q=business%20support&count=5");
      const results = (data as { results?: { title: string }[] })?.results ?? [];
      return { ok: true, summary: `${results.length} GOV.UK results for "business support".`, data: results.map((r) => r.title) };
    },
  },
];
