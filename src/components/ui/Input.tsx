import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const baseInput =
  "w-full rounded-xl border bg-white dark:bg-white/5 text-gray-900 dark:text-white " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
  "transition-colors duration-150 outline-none " +
  "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "autofill:bg-brand-50 dark:autofill:bg-brand-950";

const inputSizes = {
  sm:  "h-9  px-3   text-xs border-gray-200 dark:border-white/8",
  md:  "h-11 px-4   text-sm border-gray-200 dark:border-white/8",
  lg:  "h-12 px-4   text-base border-gray-200 dark:border-white/8",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, hint, icon, iconRight, inputSize = "md", id, className = "", ...props },
    ref,
  ) {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              baseInput,
              inputSizes[inputSize],
              icon ? "pl-10" : "",
              iconRight ? "pr-10" : "",
              error
                ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {iconRight && (
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {iconRight}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
