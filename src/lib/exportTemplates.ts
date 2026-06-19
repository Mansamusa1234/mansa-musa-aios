export interface LetterExportInput {
  title: string;
  question: string;
  answer: string;
  sources?: string[];
}

export function renderLetterExport(input: LetterExportInput): string {
  const sources = input.sources?.filter(Boolean) ?? [];

  return [
    input.title,
    "=".repeat(Math.min(Math.max(input.title.length, 12), 80)),
    "",
    "Purpose",
    "-------",
    input.question,
    "",
    "Draft letter / report",
    "---------------------",
    input.answer,
    "",
    "Sources / evidence to check",
    "---------------------------",
    ...(sources.length > 0 ? sources.map((source) => `- ${source}`) : ["- No specific source sections were supplied for this export."]),
    "",
    "Human approval checklist",
    "------------------------",
    "- Verify names, dates, addresses, account numbers, and deadlines.",
    "- Check the governing contract, statute, regulation, or policy before sending.",
    "- Remove any claim you cannot evidence.",
    "- Ask a qualified solicitor or regulated adviser before acting on legal rights or deadlines.",
    "",
    "Disclaimer",
    "----------",
    "This export is informational support, not advice from a solicitor. It is a draft starting point for review.",
  ].join("\n");
}
