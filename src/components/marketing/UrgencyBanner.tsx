"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function useCountdown(targetHours = 48) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });

  useEffect(() => {
    const key = "urgency-end";
    let end = parseInt(localStorage.getItem(key) ?? "0");
    if (!end || end < Date.now()) {
      end = Date.now() + targetHours * 3600 * 1000;
      localStorage.setItem(key, String(end));
    }

    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetHours]);

  return time;
}

export default function UrgencyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { h, m, s } = useCountdown(48);

  useEffect(() => {
    if (sessionStorage.getItem("banner-dismissed")) setDismissed(true);
  }, []);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("banner-dismissed", "1");
  }

  if (dismissed) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="relative z-50 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 py-2.5 px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-sm text-white flex-wrap">
        <span className="font-bold">🔥 FOUNDING MEMBER OFFER:</span>
        <span>Get 50% off your first 3 months — only for the first 100 customers.</span>
        <span className="flex items-center gap-1 font-mono font-bold bg-black/20 rounded px-2 py-0.5">
          ⏱ {pad(h)}:{pad(m)}:{pad(s)} left
        </span>
        <Link
          href="/register"
          className="rounded-lg bg-white px-4 py-1 text-xs font-bold text-brand-600 hover:bg-gray-100 transition-colors"
        >
          Claim offer →
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
