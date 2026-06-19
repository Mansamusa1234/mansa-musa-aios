"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Consent = { necessary: true; analytics: boolean; marketing: boolean };

const KEY = "mm_cookie_consent";

function getStored(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function store(c: Consent) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
}

export function getCookieConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  return getStored();
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getStored()) setVisible(true);
  }, []);

  function acceptAll() {
    store({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  }

  function acceptSelected() {
    store({ necessary: true, analytics, marketing });
    setVisible(false);
  }

  function rejectAll() {
    store({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f1e] p-5 shadow-2xl shadow-black/20"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
          <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">We value your privacy</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            We use cookies to improve your experience and analyse usage.{" "}
            <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mb-4 space-y-3 rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/5 p-4">
          {/* Necessary */}
          <label className="flex items-start gap-3">
            <input type="checkbox" checked disabled aria-disabled="true"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 bg-gray-100 text-brand-500 cursor-not-allowed" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Necessary <span className="ml-1 text-[10px] font-normal text-gray-400">(always on)</span></p>
              <p className="text-[11px] text-gray-400 mt-0.5">Authentication, security, and core functionality.</p>
            </div>
          </label>
          {/* Analytics */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-white/20 text-brand-500 focus:ring-brand-500/30 bg-white dark:bg-white/10 cursor-pointer" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Analytics</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PostHog, Google Analytics, Mixpanel, Microsoft Clarity — help us understand how you use the product.</p>
            </div>
          </label>
          {/* Marketing */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-white/20 text-brand-500 focus:ring-brand-500/30 bg-white dark:bg-white/10 cursor-pointer" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Marketing</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Meta Pixel, TikTok Pixel — used for advertising and retargeting.</p>
            </div>
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={acceptAll}
          className="flex-1 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
          Accept all
        </button>
        {expanded ? (
          <button onClick={acceptSelected}
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Save preferences
          </button>
        ) : (
          <button onClick={() => setExpanded(true)}
            className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Customise
          </button>
        )}
        <button onClick={rejectAll}
          className="rounded-xl px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          Reject all
        </button>
      </div>
    </div>
  );
}
