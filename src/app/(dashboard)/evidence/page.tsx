import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import EvidenceVaultClient from "./EvidenceVaultClient";

export const metadata: Metadata = {
  title: "Evidence Vault | MansaMusaAI",
  description: "Upload documents and source text for AI agents to cite in chat and Agent Arena.",
};

export const dynamic = "force-dynamic";

export default async function EvidenceVaultPage() {
  const session = await auth();
  const userId = session!.user.id;

  const result = await db.evidenceDocument.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { chunks: true } } },
      take: 60,
    })
    .then((documents) => ({ documents, setupError: "" }))
    .catch((err) => {
      console.error("[evidence] list failed:", err);
      return {
        documents: [],
        setupError: "Evidence Vault database tables are not available yet. Deploy the Prisma schema before using uploads.",
      };
    });

  return (
    <EvidenceVaultClient
      setupError={result.setupError}
      initialDocuments={result.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        mimeType: doc.mimeType,
        status: doc.status,
        sizeBytes: doc.sizeBytes,
        createdAt: doc.createdAt.toISOString(),
        chunks: doc._count.chunks,
      }))}
    />
  );
}
