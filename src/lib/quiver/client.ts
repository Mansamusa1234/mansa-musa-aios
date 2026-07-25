import "server-only";
import { z } from "zod";

const BASE = process.env.QUIVER_API_BASE_URL ?? "https://api.quiverquant.com";

function getApiKey(): string {
  const key = process.env.QUIVER_API_KEY;
  if (!key) throw new Error("[quiver] QUIVER_API_KEY is not configured");
  return key;
}

// In-memory cache: path → { data, expiresAt }
const _cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function quiverFetch(path: string): Promise<unknown> {
  const hit = _cache.get(path);
  if (hit && hit.expiresAt > Date.now()) return hit.data;

  const url = `${BASE}${path}`;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          Accept: "application/json",
        },
        // Next.js: opt out of data cache so we control freshness ourselves
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`[quiver] HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      const data: unknown = await res.json();
      _cache.set(path, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  throw lastErr;
}

// ── Zod schemas ───────────────────────────────────────────────
// Use passthrough() so unknown extra fields from the API don't break validation.

const CongressTradeSchema = z.object({
  Ticker: z.string().optional(),
  TransactionDate: z.string().optional(),
  Representative: z.string().optional(),
  Transaction: z.string().optional(),
  Amount: z.string().optional(),
  Party: z.string().optional(),
  State: z.string().optional(),
  ReportDate: z.string().optional(),
}).passthrough();

const SenateTradeSchema = z.object({
  Ticker: z.string().optional(),
  TransactionDate: z.string().optional(),
  Senator: z.string().optional(),
  Transaction: z.string().optional(),
  Amount: z.string().optional(),
  Party: z.string().optional(),
  State: z.string().optional(),
  ReportDate: z.string().optional(),
}).passthrough();

const HouseTradeSchema = z.object({
  Ticker: z.string().optional(),
  TransactionDate: z.string().optional(),
  Representative: z.string().optional(),
  Transaction: z.string().optional(),
  Amount: z.string().optional(),
  Party: z.string().optional(),
  State: z.string().optional(),
  District: z.string().optional(),
  ReportDate: z.string().optional(),
}).passthrough();

const InsiderSchema = z.object({
  Ticker: z.string().optional(),
  Name: z.string().optional(),
  Title: z.string().optional(),
  Date: z.string().optional(),
  AcquisitionOrDisposition: z.string().optional(),
  NumberOfShares: z.number().optional(),
  SharesOwnedFollowingTransaction: z.number().optional(),
  Value: z.number().optional(),
}).passthrough();

const GovContractSchema = z.object({
  Ticker: z.string().optional(),
  Date: z.string().optional(),
  Amount: z.number().optional(),
  Description: z.string().optional(),
  Agency: z.string().optional(),
}).passthrough();

const LobbyingSchema = z.object({
  Ticker: z.string().optional(),
  Client: z.string().optional(),
  Amount: z.number().optional(),
  Registrant: z.string().optional(),
  Description: z.string().optional(),
  Year: z.number().optional(),
  Quarter: z.string().optional(),
}).passthrough();

const NewsSchema = z.object({
  Ticker: z.string().optional(),
  Title: z.string().optional(),
  Date: z.string().optional(),
  Description: z.string().optional(),
  Link: z.string().optional(),
  Sentiment: z.number().optional(),
  Source: z.string().optional(),
}).passthrough();

// ── Exported types ────────────────────────────────────────────
export type CongressTrade = z.infer<typeof CongressTradeSchema>;
export type SenateTrade   = z.infer<typeof SenateTradeSchema>;
export type HouseTrade    = z.infer<typeof HouseTradeSchema>;
export type Insider       = z.infer<typeof InsiderSchema>;
export type GovContract   = z.infer<typeof GovContractSchema>;
export type LobbyingItem  = z.infer<typeof LobbyingSchema>;
export type QuiverNews    = z.infer<typeof NewsSchema>;

// ── API functions ─────────────────────────────────────────────

export async function getCongressTrading(ticker?: string): Promise<CongressTrade[]> {
  const path = ticker
    ? `/beta/historical/congresstrading/${ticker.toUpperCase()}`
    : "/beta/live/congresstrading";
  return z.array(CongressTradeSchema).parse(await quiverFetch(path));
}

export async function getSenateTrading(ticker?: string): Promise<SenateTrade[]> {
  const path = ticker
    ? `/beta/historical/senatetrading/${ticker.toUpperCase()}`
    : "/beta/live/senatetrading";
  return z.array(SenateTradeSchema).parse(await quiverFetch(path));
}

export async function getHouseTrading(ticker?: string): Promise<HouseTrade[]> {
  const path = ticker
    ? `/beta/historical/housetrading/${ticker.toUpperCase()}`
    : "/beta/live/housetrading";
  return z.array(HouseTradeSchema).parse(await quiverFetch(path));
}

export async function getInsiderTransactions(ticker?: string): Promise<Insider[]> {
  const path = ticker
    ? `/beta/historical/insiders/${ticker.toUpperCase()}`
    : "/beta/live/insiders";
  return z.array(InsiderSchema).parse(await quiverFetch(path));
}

export async function getGovContracts(ticker?: string): Promise<GovContract[]> {
  const path = ticker
    ? `/beta/historical/govcontractsall/${ticker.toUpperCase()}`
    : "/beta/live/govcontractsall";
  return z.array(GovContractSchema).parse(await quiverFetch(path));
}

export async function getLobbyingData(ticker?: string): Promise<LobbyingItem[]> {
  const path = ticker
    ? `/beta/historical/lobbying/${ticker.toUpperCase()}`
    : "/beta/live/lobbying";
  return z.array(LobbyingSchema).parse(await quiverFetch(path));
}

export async function getQuiverNews(): Promise<QuiverNews[]> {
  return z.array(NewsSchema).parse(await quiverFetch("/beta/live/quivernews"));
}
