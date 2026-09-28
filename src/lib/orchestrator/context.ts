import { CONNECTORS } from "@/lib/connectors";

type LiveContextResult = {
  context: string;
  connectorsUsed: string[];
  failures: Array<{ key: string; error: string }>;
};

const RULES: Array<{ pattern: RegExp; keys: string[] }> = [
  { pattern: /shopify|store|ecommerce|e-commerce|product|checkout|cart/i, keys: ["shopify-store"] },
  { pattern: /meta ads|facebook ads|instagram ads|paid social|campaign|roas|cpa|ctr/i, keys: ["meta-ads"] },
  { pattern: /figma|brand kit|brand guideline|creative|design system/i, keys: ["figma-brand"] },
  { pattern: /company|companies house|corporate registry/i, keys: ["companies-house"] },
  { pattern: /gov\.uk|government|uk regulation|business support/i, keys: ["gov-uk"] },
  { pattern: /crypto|bitcoin|ethereum/i, keys: ["crypto-market-data"] },
  { pattern: /news|headline|market news/i, keys: ["rss"] },
  { pattern: /users|conversations|messages|internal analytics|platform usage/i, keys: ["supabase-analytics"] },
];

export async function collectLiveContext(goal: string, ownerContext = ""): Promise<LiveContextResult> {
  const text = `${goal}\n${ownerContext}`;
  const keys = Array.from(
    new Set(RULES.filter((rule) => rule.pattern.test(text)).flatMap((rule) => rule.keys)),
  ).slice(0, 5);

  const selected = keys
    .map((key) => CONNECTORS.find((connector) => connector.key === key))
    .filter((connector): connector is NonNullable<typeof connector> => Boolean(connector))
    .filter((connector) => {
      try {
        return connector.isConfigured();
      } catch {
        return false;
      }
    });

  if (!selected.length) {
    return { context: "", connectorsUsed: [], failures: [] };
  }

  const settled = await Promise.allSettled(
    selected.map(async (connector) => ({
      connector,
      result: await connector.fetchSample(),
    })),
  );

  const chunks: string[] = [];
  const connectorsUsed: string[] = [];
  const failures: Array<{ key: string; error: string }> = [];

  for (const item of settled) {
    if (item.status === "rejected") {
      failures.push({ key: "unknown", error: item.reason instanceof Error ? item.reason.message : String(item.reason) });
      continue;
    }

    const { connector, result } = item.value;
    if (!result.ok) {
      failures.push({ key: connector.key, error: result.summary });
      continue;
    }

    connectorsUsed.push(connector.key);
    let data = "";
    if (result.data !== undefined) {
      try {
        data = JSON.stringify(result.data).slice(0, 8000);
      } catch {
        data = "[unserializable connector data]";
      }
    }

    chunks.push(
      [
        `### Live connector: ${connector.name}`,
        result.summary,
        data ? `Data: ${data}` : "",
      ].filter(Boolean).join("\n"),
    );
  }

  return {
    context: chunks.length ? `LIVE CONNECTED DATA:\n\n${chunks.join("\n\n")}` : "",
    connectorsUsed,
    failures,
  };
}
