"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mm_pwa_dismissed");
    if (stored) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    } else {
      localStorage.setItem("mm_pwa_dismissed", "1");
      setDismissed(true);
    }
    setPrompt(null);
  }

  if (!prompt || installed || dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex max-w-xs items-start gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f1e] p-4 shadow-2xl shadow-black/20 md:bottom-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Install MansaMusaAI</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Add to your home screen for the fastest experience.</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Install app
          </button>
          <button
            onClick={() => { localStorage.setItem("mm_pwa_dismissed", "1"); setDismissed(true); }}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
