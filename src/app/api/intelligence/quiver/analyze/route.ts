import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { getActivePlan, hasFeature } from "@/lib/subscription";
import { anthropic } from "@/lib/anthropic";
import {
  getCongressTrading,
  getSenateTrading,
  getHouseTrading,
  getInsiderTransactions,
  getGovContracts,
  getLobbyingData,
} from "@/lib/quiver/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkRateLimit(limiters.quiver, session.user.id);
  if (limited) return limited;

  const plan = await getActivePlan(session.user.id);
  if (!hasFeature(plan, "quiver_intel"))
    return NextResponse.json({ error: "Upgrade to Starter or above to access Market Intelligence." }, { status: 403 });

  const body = await req.json() as { ticker?: string };
  const ticker = body.ticker?.trim().toUpperCase();
  if (!ticker) return NextResponse.json({ error: "ticker is required" }, { status: 400 });

  const [congress, senate, house, insiders, contracts, lobbying] = await Promise.allSettled([
    getCongressTrading(ticker),
    getSenateTrading(ticker),
    getHouseTrading(ticker),
    getInsiderTransactions(ticker),
    getGovContracts(ticker),
    getLobbyingData(ticker),
  ]);

  const safe = <T>(r: PromiseSettledResult<T[]>): T[] =>
    r.status === "fulfilled" ? r.value.slice(0, 15) : [];

  const context = JSON.stringify(
    {
      ticker,
      congressTrades: safe(congress),
      senateTrades: safe(senate),
      houseTrades: safe(house),
      insiderTransactions: safe(insiders),
      governmentContracts: safe(contracts),
      lobbying: safe(lobbying),
    },
    null,
    2,
  );

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 900,
    system: `You are a financial intelligence analyst. Summarise alternative data about a publicly listed company in 3–4 short, impartial paragraphs.

Rules:
- Base your analysis ONLY on the data provided — do not invent or extrapolate.
- Do not claim certainty about future stock prices or returns.
- Congressional, Senate, and House trades are legally required public disclosures — do not describe them as confidential insider information.
- Note data gaps (e.g. "No government contracts found") rather than omitting sections.
- End with a one-sentence "Signal Summary" that characterises overall alternative-data sentiment (bullish / bearish / mixed / neutral) with brief reasoning.
- This output is for informational purposes only and is not investment advice.`,
    messages: [
      {
        role: "user",
        content: `Analyse this alternative data for ${ticker}:\n\n${context}`,
      },
    ],
  });

  const analysis = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  return NextResponse.json({ ticker, analysis });
}
