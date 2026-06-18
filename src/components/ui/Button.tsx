import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm disabled:bg-brand-400",
  secondary:
    "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 dark:bg-white/8 dark:text-white dark:border-white/10 dark:hover:bg-white/12",
  ghost:
    "text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/6 dark:active:bg-white/10",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
  outline:
    "border border-brand-500/40 text-brand-600 hover:bg-brand-50 hover:border-brand-500/60 dark:text-brand-400 dark:hover:bg-brand-500/10",
};

const sizes: Record<Size, string> = {
  sm:  "h-8  px-3   text-xs  gap-1.5 rounded-lg",
  md:  "h-10 px-4   text-sm  gap-2   rounded-xl",
  lg:  "h-11 px-5   text-sm  gap-2   rounded-xl",
  xl:  "h-12 px-6   text-base gap-2.5 rounded-xl",
};

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center font-semibold select-none",
          "transition-all duration-200 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? <Spinner /> : icon ? <span className="shrink-0">{icon}</span> : null}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  },
);
