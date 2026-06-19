export type DictionaryModuleId =
  | "black-1e"
  | "black-later-licensed"
  | "jowitt-licensed"
  | "stroud-licensed"
  | "bouvier-public-domain"
  | "uk-glossary"
  | "common-law-glossary"
  | "legal-source-types";

export interface LegalDictionaryEntry {
  id: string;
  term: string;
  definition: string;
  moduleId: DictionaryModuleId;
  sourceLabel: string;
  citation: string;
  sourceType: "public-domain" | "licensed-required" | "glossary" | "explanation";
  note?: string;
}

export interface DictionaryModule {
  id: DictionaryModuleId;
  title: string;
  status: "available" | "requires-user-licensed-text";
  sourceLabel: string;
  notice: string;
}

export const DICTIONARY_MODULES: DictionaryModule[] = [
  {
    id: "black-1e",
    title: "Black's Law Dictionary 1st Edition",
    status: "available",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    notice: "Public-domain terminology notes for explanation only; not legal authority.",
  },
  {
    id: "black-later-licensed",
    title: "Black's Law Dictionary later editions",
    status: "requires-user-licensed-text",
    sourceLabel: "User-provided licensed Black's Law Dictionary text",
    notice: "Disabled until the user uploads licensed text. Do not scrape copyrighted editions.",
  },
  {
    id: "jowitt-licensed",
    title: "Jowitt's Dictionary of English Law",
    status: "requires-user-licensed-text",
    sourceLabel: "User-provided licensed Jowitt's text",
    notice: "Disabled until the user uploads licensed text. Do not scrape copyrighted editions.",
  },
  {
    id: "stroud-licensed",
    title: "Stroud's Judicial Dictionary",
    status: "requires-user-licensed-text",
    sourceLabel: "User-provided licensed Stroud's text",
    notice: "Disabled until the user uploads licensed text. Do not scrape copyrighted editions.",
  },
  {
    id: "bouvier-public-domain",
    title: "Bouvier's Law Dictionary public-domain version",
    status: "available",
    sourceLabel: "Bouvier's Law Dictionary, public-domain edition",
    notice: "Public-domain terminology notes for explanation only; not legal authority.",
  },
  {
    id: "uk-glossary",
    title: "UK legal terminology glossary",
    status: "available",
    sourceLabel: "MansaMusaAI UK legal glossary",
    notice: "Plain-English glossary for orientation only; check current primary law.",
  },
  {
    id: "common-law-glossary",
    title: "Common law terminology glossary",
    status: "available",
    sourceLabel: "MansaMusaAI common law glossary",
    notice: "Plain-English glossary for orientation only; not a substitute for jurisdiction-specific advice.",
  },
  {
    id: "legal-source-types",
    title: "Statute vs regulation vs policy vs contract explanations",
    status: "available",
    sourceLabel: "MansaMusaAI legal source-type explainer",
    notice: "Explanatory classification; check the governing instrument before acting.",
  },
];

export const LEGAL_DICTIONARY_ENTRIES: LegalDictionaryEntry[] = [
  {
    id: "black-1e-affidavit",
    term: "Affidavit",
    definition: "A written or printed declaration or statement of facts, made voluntarily, and confirmed by oath or affirmation.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Affidavit",
    sourceType: "public-domain",
  },
  {
    id: "black-1e-common-law",
    term: "Common law",
    definition: "That body of law and juristic theory which was originated, developed, and formulated and is administered in England.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Common law",
    sourceType: "public-domain",
  },
  {
    id: "black-1e-contract",
    term: "Contract",
    definition: "An agreement, upon sufficient consideration, to do or not to do a particular thing.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Contract",
    sourceType: "public-domain",
  },
  {
    id: "black-1e-evidence",
    term: "Evidence",
    definition: "Any species of proof, or probative matter, legally presented at the trial of an issue.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Evidence",
    sourceType: "public-domain",
  },
  {
    id: "black-1e-fraud",
    term: "Fraud",
    definition: "An intentional perversion of truth for the purpose of inducing another to part with some valuable thing.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Fraud",
    sourceType: "public-domain",
  },
  {
    id: "black-1e-jurisdiction",
    term: "Jurisdiction",
    definition: "The power and authority constitutionally conferred upon a court or judge to pronounce the sentence of the law.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Jurisdiction",
    sourceType: "public-domain",
  },
  {
    id: "black-1e-liability",
    term: "Liability",
    definition: "The state of being bound or obliged in law or justice to do, pay, or make good something.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Liability",
    sourceType: "public-domain",
  },
  {
    id: "black-1e-statute",
    term: "Statute",
    definition: "An act of the legislature declaring, commanding, or prohibiting something.",
    moduleId: "black-1e",
    sourceLabel: "Black's Law Dictionary, 1st ed. (1891)",
    citation: "Black's Law Dictionary, 1st ed. (1891), term: Statute",
    sourceType: "public-domain",
  },
  {
    id: "bouvier-action",
    term: "Action",
    definition: "A lawful demand of one's right in a court of justice.",
    moduleId: "bouvier-public-domain",
    sourceLabel: "Bouvier's Law Dictionary, public-domain edition",
    citation: "Bouvier's Law Dictionary, public-domain edition, term: Action",
    sourceType: "public-domain",
  },
  {
    id: "bouvier-consideration",
    term: "Consideration",
    definition: "The cause, motive, price, or impelling influence which induces a contracting party to enter into a contract.",
    moduleId: "bouvier-public-domain",
    sourceLabel: "Bouvier's Law Dictionary, public-domain edition",
    citation: "Bouvier's Law Dictionary, public-domain edition, term: Consideration",
    sourceType: "public-domain",
  },
  {
    id: "bouvier-tort",
    term: "Tort",
    definition: "A private or civil wrong or injury, independent of contract.",
    moduleId: "bouvier-public-domain",
    sourceLabel: "Bouvier's Law Dictionary, public-domain edition",
    citation: "Bouvier's Law Dictionary, public-domain edition, term: Tort",
    sourceType: "public-domain",
  },
  {
    id: "uk-solicitor",
    term: "Solicitor",
    definition: "In England and Wales, a regulated legal professional who can advise clients, prepare documents, and conduct reserved legal activities where authorised.",
    moduleId: "uk-glossary",
    sourceLabel: "MansaMusaAI UK legal glossary",
    citation: "MansaMusaAI UK legal glossary, term: Solicitor",
    sourceType: "glossary",
  },
  {
    id: "uk-barrister",
    term: "Barrister",
    definition: "A legal professional often instructed for advocacy, specialist advice, and court representation, subject to professional regulation.",
    moduleId: "uk-glossary",
    sourceLabel: "MansaMusaAI UK legal glossary",
    citation: "MansaMusaAI UK legal glossary, term: Barrister",
    sourceType: "glossary",
  },
  {
    id: "common-law-precedent",
    term: "Precedent",
    definition: "A prior judicial decision that may guide or bind later decisions depending on the court hierarchy and the legal issue.",
    moduleId: "common-law-glossary",
    sourceLabel: "MansaMusaAI common law glossary",
    citation: "MansaMusaAI common law glossary, term: Precedent",
    sourceType: "glossary",
  },
  {
    id: "common-law-equity",
    term: "Equity",
    definition: "A body of principles historically developed to soften rigid common-law rules and provide remedies such as injunctions or specific performance.",
    moduleId: "common-law-glossary",
    sourceLabel: "MansaMusaAI common law glossary",
    citation: "MansaMusaAI common law glossary, term: Equity",
    sourceType: "glossary",
  },
  {
    id: "source-statute",
    term: "Statute",
    definition: "Primary legislation passed by a legislature. It usually outranks policy, guidance, and private contract terms where they conflict.",
    moduleId: "legal-source-types",
    sourceLabel: "MansaMusaAI legal source-type explainer",
    citation: "MansaMusaAI legal source-type explainer, source type: Statute",
    sourceType: "explanation",
  },
  {
    id: "source-regulation",
    term: "Regulation",
    definition: "A binding legal rule usually made under authority delegated by statute. Check the enabling statute and current version.",
    moduleId: "legal-source-types",
    sourceLabel: "MansaMusaAI legal source-type explainer",
    citation: "MansaMusaAI legal source-type explainer, source type: Regulation",
    sourceType: "explanation",
  },
  {
    id: "source-policy",
    term: "Policy",
    definition: "An internal or public rule of practice that may guide decisions but is not automatically the same as binding law.",
    moduleId: "legal-source-types",
    sourceLabel: "MansaMusaAI legal source-type explainer",
    citation: "MansaMusaAI legal source-type explainer, source type: Policy",
    sourceType: "explanation",
  },
  {
    id: "source-contract",
    term: "Contract",
    definition: "A private agreement that can bind the parties, subject to applicable law, enforceability rules, and the actual wording agreed.",
    moduleId: "legal-source-types",
    sourceLabel: "MansaMusaAI legal source-type explainer",
    citation: "MansaMusaAI legal source-type explainer, source type: Contract",
    sourceType: "explanation",
  },
];

export const LICENSED_PLACEHOLDER_ENTRIES: LegalDictionaryEntry[] = [
  {
    id: "black-later-placeholder",
    term: "Black's Law Dictionary later editions",
    definition: "Available only when the user provides licensed text for indexing.",
    moduleId: "black-later-licensed",
    sourceLabel: "User-provided licensed Black's Law Dictionary text",
    citation: "Licensed text required; no copyrighted text bundled.",
    sourceType: "licensed-required",
  },
  {
    id: "jowitt-placeholder",
    term: "Jowitt's Dictionary of English Law",
    definition: "Available only when the user provides licensed text for indexing.",
    moduleId: "jowitt-licensed",
    sourceLabel: "User-provided licensed Jowitt's text",
    citation: "Licensed text required; no copyrighted text bundled.",
    sourceType: "licensed-required",
  },
  {
    id: "stroud-placeholder",
    term: "Stroud's Judicial Dictionary",
    definition: "Available only when the user provides licensed text for indexing.",
    moduleId: "stroud-licensed",
    sourceLabel: "User-provided licensed Stroud's text",
    citation: "Licensed text required; no copyrighted text bundled.",
    sourceType: "licensed-required",
  },
];

export function searchLegalDictionary(query: string, limit = 8): LegalDictionaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return LEGAL_DICTIONARY_ENTRIES
    .map((entry) => {
      const term = entry.term.toLowerCase();
      const definition = entry.definition.toLowerCase();
      const score =
        term === q ? 100 :
        term.includes(q) ? 60 :
        definition.includes(q) ? 25 :
        q.split(/\s+/).filter((part) => part.length > 2 && (term.includes(part) || definition.includes(part))).length * 8;
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.term.localeCompare(b.entry.term))
    .slice(0, limit)
    .map((item) => item.entry);
}

export function findDictionaryEntriesInText(text: string, limit = 6): LegalDictionaryEntry[] {
  const lower = text.toLowerCase();
  return LEGAL_DICTIONARY_ENTRIES
    .filter((entry) => lower.includes(entry.term.toLowerCase()))
    .slice(0, limit);
}

export function formatDictionaryEntriesForPrompt(entries: LegalDictionaryEntry[]): string {
  if (entries.length === 0) return "No matching dictionary entries found in the bundled public-domain/glossary library.";
  return entries
    .map((entry) => `- ${entry.term} [${entry.sourceLabel}]: ${entry.definition} Citation/source label: ${entry.citation}`)
    .join("\n");
}

export function formatDictionarySources(entries: LegalDictionaryEntry[]): string {
  if (entries.length === 0) return "";
  return [
    "Sources Used",
    ...entries.map((entry) => `- ${entry.term}: ${entry.citation}`),
    "- Dictionary definitions are for explanation only, not legal authority.",
  ].join("\n");
}
