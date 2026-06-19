"use client";

import { useState } from "react";

interface EvidenceDocumentRow {
  id: string;
  filename: string;
  mimeType: string;
  status: string;
  sizeBytes: number;
  createdAt: string;
  chunks: number;
}

interface EvidenceSource {
  id: string;
  filename: string;
  text: string;
  pageNumber: number | null;
  sectionLabel: string | null;
}

interface Props {
  initialDocuments: EvidenceDocumentRow[];
  setupError?: string;
}

export default function EvidenceVaultClient({ initialDocuments, setupError }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<EvidenceSource[]>([]);
  const [searching, setSearching] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append("files", file));
      const res = await fetch("/api/evidence/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        return;
      }
      setDocuments((prev) => [
        ...data.uploaded.map((doc: { id: string; filename: string; status: string; chunks: number }) => ({
          id: doc.id,
          filename: doc.filename,
          mimeType: "",
          status: doc.status,
          sizeBytes: 0,
          createdAt: new Date().toISOString(),
          chunks: doc.chunks,
        })),
        ...prev,
      ]);
    } finally {
      setUploading(false);
    }
  }

  async function search() {
    setSearching(true);
    try {
      const res = await fetch(`/api/evidence/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSources(data.sources ?? []);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Evidence Vault ·</p>
        <h1 className="text-3xl font-extrabold text-white">Upload evidence agents can cite</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Upload contracts, letters, notes, and source text you are allowed to use. Text files are indexed now; PDFs are stored as metadata until parser/storage is configured.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {setupError && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200 lg:col-span-2">
            {setupError}
          </div>
        )}

        <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <h2 className="text-sm font-bold text-white">Upload lawful sources</h2>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Do not upload material you do not own or have permission to use. Evidence citations are informational support, not legal advice.
          </p>
          <input
            type="file"
            multiple
            accept=".txt,.md,.csv,.pdf,text/plain,text/markdown,text/csv,application/pdf"
            onChange={(e) => upload(e.target.files)}
            className="mt-4 block w-full text-xs text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          {uploading && <p className="mt-2 text-xs text-brand-300">Uploading...</p>}
          {uploadError && <p className="mt-2 text-xs text-red-400">{uploadError}</p>}
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <h2 className="text-sm font-bold text-white">Search your evidence</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
              placeholder="Search dates, names, contract clauses, debt, notice..."
              className="flex-1 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-500/40"
            />
            <button
              onClick={search}
              disabled={searching || query.trim().length < 2}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>
        </section>
      </div>

      {sources.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-white">Matching source sections</h2>
          <div className="space-y-3">
            {sources.map((source) => (
              <article key={source.id} className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4">
                <p className="text-xs font-bold text-brand-300">{source.filename} · {source.sectionLabel ?? "uploaded text"}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-300">{source.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-white">Uploaded documents</h2>
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
            No evidence uploaded yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="truncate text-sm font-bold text-white">{doc.filename}</p>
                <p className="mt-1 text-xs text-gray-500">{doc.status} · {doc.chunks} source section{doc.chunks === 1 ? "" : "s"}</p>
                <p className="mt-2 text-[11px] text-gray-600">{new Date(doc.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
