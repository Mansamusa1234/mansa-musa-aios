"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function UrgencyBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("banner-dismissed")) setDismissed(true);
  }, []);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("banner-dismissed", "1");
  }

  if (dismissed) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 py-2.5 px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-sm text-white flex-wrap">
        <span className="font-bold">START FREE TODAY:</span>
        <span>Join without a card, then upgrade only when you need more agents and automation.</span>
        <Link
          href="/register"
          className="rounded-lg bg-white px-4 py-1 text-xs font-bold text-brand-600 hover:bg-gray-100 transition-colors"
        >
          Join free →
        </Link>
      </div>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-lg"
      >
        ✕
      </button>
    </div>
  );
}
