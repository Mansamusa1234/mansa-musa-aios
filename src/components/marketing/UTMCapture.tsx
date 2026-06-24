"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function UTMCapture() {
  const params = useSearchParams();

  useEffect(() => {
    const utm: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "via"].forEach((k) => {
      const v = params.get(k);
      if (v) utm[k] = v;
    });

    if (Object.keys(utm).length === 0) return;

    // Persist for 90 days
    const existing = JSON.parse(localStorage.getItem("mm_utm") ?? "{}");
    if (!existing.utm_source) {
      // First-touch attribution — only write if not already set
      localStorage.setItem("mm_utm", JSON.stringify({ ...utm, captured_at: new Date().toISOString() }));
    }
    // Always write last-touch
    localStorage.setItem("mm_utm_last", JSON.stringify({ ...utm, captured_at: new Date().toISOString() }));
  }, [params]);

  return null;
}
