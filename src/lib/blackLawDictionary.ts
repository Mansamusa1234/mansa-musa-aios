import { LEGAL_DICTIONARY_ENTRIES } from "@/lib/legalDictionary";

export interface BlackLawTerm {
  term: string;
  definition: string;
}

export const BLACK_LAW_1E_TERMS: BlackLawTerm[] = LEGAL_DICTIONARY_ENTRIES
  .filter((entry) => entry.moduleId === "black-1e")
  .map((entry) => ({ term: entry.term, definition: entry.definition }));

export function formatBlackLawTermsForPrompt(): string {
  return BLACK_LAW_1E_TERMS
    .map((entry) => `- ${entry.term}: ${entry.definition}`)
    .join("\n");
}
