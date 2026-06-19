import { db } from "@/lib/db";

export interface EvidenceSource {
  id: string;
  documentId: string;
  filename: string;
  text: string;
  pageNumber: number | null;
  sectionLabel: string | null;
}

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 180;

export function normaliseEvidenceText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkEvidenceText(text: string): string[] {
  const clean = normaliseEvidenceText(text);
  if (!clean) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(clean.length, start + CHUNK_SIZE);
    const slice = clean.slice(start, end).trim();
    if (slice) chunks.push(slice);
    if (end === clean.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
  }
  return chunks;
}

export function scoreEvidenceChunk(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  if (terms.length === 0) return 0;

  return terms.reduce((score, term) => score + (lowerText.includes(term) ? 1 : 0), 0);
}

export async function searchEvidenceChunks(userId: string, query: string, limit = 6): Promise<EvidenceSource[]> {
  const terms = query.split(/[^a-zA-Z0-9]+/).filter((term) => term.length > 2).slice(0, 8);
  if (terms.length === 0) return [];

  const chunks = await db.evidenceChunk.findMany({
      where: {
        userId,
        OR: terms.map((term) => ({ text: { contains: term, mode: "insensitive" as const } })),
      },
      include: { document: { select: { filename: true } } },
      take: 40,
      orderBy: { createdAt: "desc" },
    })
    .catch((err) => {
      console.error("[evidence] search failed:", err);
      return [];
    });

  return chunks
    .map((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      filename: chunk.document.filename,
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      sectionLabel: chunk.sectionLabel,
      score: scoreEvidenceChunk(chunk.text, query),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...chunk }) => chunk);
}

export function formatEvidenceForPrompt(sources: EvidenceSource[]): string {
  if (sources.length === 0) return "No matching Evidence Vault sources were found for this question.";

  return sources
    .map((source, index) => {
      const locator = source.pageNumber ? `page ${source.pageNumber}` : source.sectionLabel ?? "uploaded text";
      return `[E${index + 1}] ${source.filename} (${locator})\n${source.text}`;
    })
    .join("\n\n");
}

export function formatEvidenceSourcesPanel(sources: EvidenceSource[]): string {
  if (sources.length === 0) return "";

  return [
    "Evidence Used",
    ...sources.map((source, index) => {
      const locator = source.pageNumber ? `page ${source.pageNumber}` : source.sectionLabel ?? "uploaded text";
      return `- [E${index + 1}] ${source.filename} (${locator})`;
    }),
  ].join("\n");
}
