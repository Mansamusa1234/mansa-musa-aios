"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Props {
  message?: string;
  ctaText?: string;
  ctaHref?: string;
  promoCode?: string;
  expiresHours?: number;
}

function useCountdown(expiresHours: number) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const key = "mm_offer_end";
    let end = parseInt(localStorage.getItem(key) ?? "0", 10);
    if (!end || end < Date.now()) {
      end = Date.now() + expiresHours * 3600 * 1000;
      localStorage.setItem(key, String(end));
    }

    function tick() {
      const diff = Math.max(0, end - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresHours]);

  return time;
}

export default function PromoBanner({
  message = "🔥 Launch offer — 20% off your first 3 months",
  ctaText = "Claim discount",
  ctaHref = "/register",
  promoCode = "LAUNCH20",
  expiresHours = 48,
}: Props) {
  const [dismissed, setDismissed] = useState(true);
  const [copied, setCopied] = useState(false);
  const { h, m, s } = useCountdown(expiresHours);

  useEffect(() => {
    const key = "mm_banner_dismissed";
    if (!sessionStorage.getItem(key)) setDismissed(false);
  }, []);

  function dismiss() {
    sessionStorage.setItem("mm_banner_dismissed", "1");
    setDismissed(true);
  }

  function copy() {
    navigator.clipboard.writeText(promoCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-2.5 text-sm text-white">
            <span className="font-semibold">{message}</span>

            {/* Countdown */}
            <span className="flex items-center gap-1 font-mono text-xs bg-white/20 rounded-md px-2 py-0.5">
              <span>{pad(h)}h</span>
              <span className="opacity-60">:</span>
              <span>{pad(m)}m</span>
              <span className="opacity-60">:</span>
              <span>{pad(s)}s</span>
            </span>

            {/* Promo code */}
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-md border border-white/40 bg-white/15 px-2.5 py-0.5 text-xs font-bold tracking-wider hover:bg-white/25 transition-colors"
            >
              {copied ? "✓ Copied!" : `Code: ${promoCode}`}
            </button>

            <Link
              href={ctaHref}
              className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors shadow-sm"
            >
              {ctaText} →
            </Link>

            <button
              onClick={dismiss}
              className="ml-2 text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
