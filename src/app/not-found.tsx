import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | MansaMusaAI",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-brand-500/20 select-none">404</p>
        <h1 className="mt-2 text-2xl font-extrabold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
