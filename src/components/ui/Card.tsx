import { type HTMLAttributes } from "react";

type Variant = "default" | "raised" | "bordered" | "ghost";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variants: Record<Variant, string> = {
  default:  "bg-white dark:bg-white/4 border border-gray-100 dark:border-white/6 shadow-card",
  raised:   "bg-white dark:bg-[#09091a] border border-gray-100 dark:border-white/8 shadow-card-md",
  bordered: "bg-transparent border border-gray-200 dark:border-white/8",
  ghost:    "bg-gray-50 dark:bg-white/3",
};

const paddings = {
  none: "",
  sm:   "p-4",
  md:   "p-5 sm:p-6",
  lg:   "p-6 sm:p-8",
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl",
        variants[variant],
        paddings[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["flex items-center justify-between mb-4", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={["text-base font-semibold text-gray-900 dark:text-white", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </h3>
  );
}
