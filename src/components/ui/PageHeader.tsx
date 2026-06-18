"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  description?: string;
  back?: string | true;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  back,
  backLabel = "Back",
  badge,
  actions,
  className = "",
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={["flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-6", className].filter(Boolean).join(" ")}>
      <div className="min-w-0">
        {back && (
          <div className="mb-2">
            {back === true ? (
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Go back"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {backLabel}
              </button>
            ) : (
              <Link
                href={back}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label={backLabel}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {backLabel}
              </Link>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl leading-tight">
            {title}
          </h1>
          {badge}
        </div>

        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-3 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
