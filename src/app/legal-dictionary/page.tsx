import type { Metadata } from "next";
import {
  DICTIONARY_MODULES,
  LICENSED_PLACEHOLDER_ENTRIES,
  searchLegalDictionary,
} from "@/lib/legalDictionary";
import LegalDictionaryClient from "./LegalDictionaryClient";

export const metadata: Metadata = {
  title: "Legal Dictionary | MansaMusaAI",
  description: "Search public-domain legal dictionary terms and lawful user-provided legal glossary sources.",
  robots: { index: false },
};

export default function LegalDictionaryPage() {
  return (
    <LegalDictionaryClient
      modules={DICTIONARY_MODULES}
      initialResults={searchLegalDictionary("contract", 8)}
      licensedPlaceholders={LICENSED_PLACEHOLDER_ENTRIES}
    />
  );
}
