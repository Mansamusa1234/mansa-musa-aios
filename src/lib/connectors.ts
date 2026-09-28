import { XMLParser } from "fast-xml-parser";
import { db } from "@/lib/db";
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
    isConfigured: () => false,
    notConfiguredReason: "Stripe connector tests are temporarily disabled for deployment.",
    fetchSample: async () => ({ ok: false, summary: "Stripe connector tests are temporarily disabled for deployment." }),
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
  {
    key: "shopify-store",
    name: "Shopify Store Connector",
    category: "Commerce",
    description: "Read-only Shopify Admin GraphQL access for store, product and commerce intelligence.",
    isConfigured: () =>
      !!process.env.SHOPIFY_STORE_DOMAIN &&
      !!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN &&
      !!process.env.SHOPIFY_API_VERSION,
    notConfiguredReason: "Needs SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN and SHOPIFY_API_VERSION.",
    fetchSample: async () => {
      const domain = process.env.SHOPIFY_STORE_DOMAIN!;
      const version = process.env.SHOPIFY_API_VERSION!;
      const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;
      const query = `query MansaStoreSnapshot {
        shop { name myshopifyDomain }
        products(first: 3, sortKey: UPDATED_AT, reverse: true) {
          nodes { id title status updatedAt }
        }
      }`;
      const hostname = domain.trim().replace("https://", "").replace("http://", "").split("/")[0];
      const response = await fetch(
        `https://${hostname}/admin/api/${version}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
          },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) throw new Error(`Shopify HTTP ${response.status}`);
      const payload = await response.json() as {
        data?: { shop?: { name?: string; myshopifyDomain?: string }; products?: { nodes?: unknown[] } };
        errors?: Array<{ message?: string }>;
      };
      if (payload.errors?.length) {
        throw new Error(payload.errors.map((e) => e.message).filter(Boolean).join("; ") || "Shopify GraphQL error");
      }
      const count = payload.data?.products?.nodes?.length ?? 0;
      return {
        ok: true,
        summary: `Connected to Shopify store ${payload.data?.shop?.name || payload.data?.shop?.myshopifyDomain || domain}; loaded ${count} recent products.`,
        data: payload.data,
      };
    },
  },
  {
    key: "meta-ads",
    name: "Meta Ads Connector",
    category: "Marketing",
    description: "Read-only Meta Marketing API campaign performance snapshot for the configured ad account.",
    isConfigured: () =>
      !!process.env.META_AD_ACCOUNT_ID &&
      !!process.env.META_ACCESS_TOKEN &&
      !!process.env.META_GRAPH_API_VERSION,
    notConfiguredReason: "Needs META_AD_ACCOUNT_ID, META_ACCESS_TOKEN and META_GRAPH_API_VERSION.",
    fetchSample: async () => {
      const accountId = process.env.META_AD_ACCOUNT_ID!.replace(/^act_/, "");
      const version = process.env.META_GRAPH_API_VERSION!;
      const params = new URLSearchParams({
        fields: "campaign_name,spend,impressions,clicks,ctr,cpc",
        date_preset: "last_7d",
        level: "campaign",
        limit: "10",
      });
      const response = await fetch(
        `https://graph.facebook.com/${version}/act_${accountId}/insights?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN!}` },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Meta Ads HTTP ${response.status}${detail ? ": " + detail.slice(0, 180) : ""}`);
      }
      const payload = await response.json() as { data?: unknown[] };
      const count = payload.data?.length ?? 0;
      return {
        ok: true,
        summary: `Loaded ${count} Meta Ads campaign performance rows for the last 7 days.`,
        data: payload.data ?? [],
      };
    },
  },
  {
    key: "figma-brand",
    name: "Figma Brand Connector",
    category: "Creative",
    description: "Read-only Figma file snapshot for brand-kit, components and creative context.",
    isConfigured: () => !!process.env.FIGMA_ACCESS_TOKEN && !!process.env.FIGMA_FILE_KEY,
    notConfiguredReason: "Needs FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY.",
    fetchSample: async () => {
      const response = await fetch(
        `https://api.figma.com/v1/files/${encodeURIComponent(process.env.FIGMA_FILE_KEY!)}?depth=2`,
        {
          headers: { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN! },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) throw new Error(`Figma HTTP ${response.status}`);
      const payload = await response.json() as {
        name?: string;
        lastModified?: string;
        version?: string;
        document?: { children?: Array<{ id?: string; name?: string; type?: string }> };
      };
      const pages = payload.document?.children?.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
      })) ?? [];
      return {
        ok: true,
        summary: `Loaded Figma file "${payload.name || "Brand file"}" with ${pages.length} top-level pages.`,
        data: {
          name: payload.name,
          lastModified: payload.lastModified,
          version: payload.version,
          pages,
        },
      };
    },
  },

];
