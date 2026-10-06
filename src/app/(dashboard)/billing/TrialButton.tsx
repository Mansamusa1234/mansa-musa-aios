"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function TrialButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function startTrial() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/subscription/start-trial", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to start trial");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to start trial"); }
    finally { setBusy(false); }
  }
  return <div><button disabled={busy} onClick={startTrial} className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50">{busy ? "Starting…" : "Start free trial"}</button>{error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}</div>;
}
