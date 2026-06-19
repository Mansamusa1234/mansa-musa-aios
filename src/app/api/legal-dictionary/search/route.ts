import { NextResponse } from "next/server";
import {
  DICTIONARY_MODULES,
  LICENSED_PLACEHOLDER_ENTRIES,
  searchLegalDictionary,
} from "@/lib/legalDictionary";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  return NextResponse.json({
    query: q,
    modules: DICTIONARY_MODULES,
    results: searchLegalDictionary(q, 20),
    licensedPlaceholders: LICENSED_PLACEHOLDER_ENTRIES,
    disclaimer: "Dictionary definitions are for explanation only, not legal authority. Do not scrape copyrighted books; upload only public-domain or licensed/user-provided text.",
  });
}
