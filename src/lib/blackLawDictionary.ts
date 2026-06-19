export interface BlackLawTerm {
  term: string;
  definition: string;
}

// Black's Law Dictionary, 1st Edition (1891) terminology notes for definitions only.
// These entries help agents explain legal words plainly; they are not legal authority.
export const BLACK_LAW_1E_TERMS: BlackLawTerm[] = [
  {
    term: "Affidavit",
    definition: "A written or printed declaration or statement of facts, made voluntarily, and confirmed by oath or affirmation.",
  },
  {
    term: "Common law",
    definition: "That body of law and juristic theory which was originated, developed, and formulated and is administered in England.",
  },
  {
    term: "Contract",
    definition: "An agreement, upon sufficient consideration, to do or not to do a particular thing.",
  },
  {
    term: "Evidence",
    definition: "Any species of proof, or probative matter, legally presented at the trial of an issue.",
  },
  {
    term: "Fraud",
    definition: "An intentional perversion of truth for the purpose of inducing another to part with some valuable thing.",
  },
  {
    term: "Jurisdiction",
    definition: "The power and authority constitutionally conferred upon a court or judge to pronounce the sentence of the law.",
  },
  {
    term: "Liability",
    definition: "The state of being bound or obliged in law or justice to do, pay, or make good something.",
  },
  {
    term: "Statute",
    definition: "An act of the legislature declaring, commanding, or prohibiting something.",
  },
];

export function formatBlackLawTermsForPrompt(): string {
  return BLACK_LAW_1E_TERMS
    .map((entry) => `- ${entry.term}: ${entry.definition}`)
    .join("\n");
}
