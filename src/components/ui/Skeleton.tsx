import { type HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  variant?: "default" | "circle" | "text";
}

export function Skeleton({
  width,
  height,
  rounded = "rounded-lg",
  variant = "default",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const base =
    "animate-pulse bg-gray-200 dark:bg-white/5 shrink-0";

  const variants = {
    default: rounded,
    circle:  "rounded-full",
    text:    "rounded-md",
  };

  return (
    <div
      className={[base, variants[variant], className].filter(Boolean).join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={14}
          width={i === lines - 1 ? "70%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "rounded-2xl border border-gray-100 dark:border-white/6 bg-white dark:bg-white/4 p-5 space-y-3 animate-pulse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <Skeleton height={16} width={120} />
      <Skeleton height={28} width={80} />
      <Skeleton variant="text" height={12} width="60%" />
    </div>
  );
}
