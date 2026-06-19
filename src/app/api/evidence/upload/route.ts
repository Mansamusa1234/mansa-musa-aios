import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chunkEvidenceText, normaliseEvidenceText } from "@/lib/evidenceVault";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function isTextFile(file: File): boolean {
  return file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "Upload at least one lawful evidence file." }, { status: 400 });
  }

  const uploaded = [];
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `${file.name} is too large. Maximum size is 2MB for this MVP.` }, { status: 400 });
    }
    if (!isTextFile(file) && !isPdfFile(file)) {
      return NextResponse.json({ error: `${file.name} is not supported. Upload TXT, MD, CSV, or PDF files.` }, { status: 400 });
    }

    try {
      if (isPdfFile(file)) {
        const document = await db.evidenceDocument.create({
          data: {
            userId: session.user.id,
            filename: file.name,
            mimeType: file.type || "application/pdf",
            sizeBytes: file.size,
            sourceType: "USER_UPLOAD_PDF",
            status: "PENDING_TEXT_EXTRACTION",
          },
        });
        uploaded.push({ id: document.id, filename: document.filename, chunks: 0, status: document.status });
        continue;
      }

      const text = normaliseEvidenceText(await file.text());
      const chunks = chunkEvidenceText(text);
      const document = await db.evidenceDocument.create({
        data: {
          userId: session.user.id,
          filename: file.name,
          mimeType: file.type || "text/plain",
          sizeBytes: file.size,
          sourceType: "USER_UPLOAD_TEXT",
          status: chunks.length > 0 ? "READY" : "EMPTY",
          chunks: {
            create: chunks.map((chunk, index) => ({
              userId: session.user.id,
              text: chunk,
              sectionLabel: `chunk ${index + 1}`,
            })),
          },
        },
      });
      uploaded.push({ id: document.id, filename: document.filename, chunks: chunks.length, status: document.status });
    } catch (err) {
      console.error("[evidence] upload failed:", err);
      return NextResponse.json(
        { error: "Evidence Vault database tables are not available yet. Deploy the Prisma schema before using uploads." },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({ uploaded });
}
