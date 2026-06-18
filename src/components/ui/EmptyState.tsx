interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm:  { icon: "h-10 w-10", iconWrap: "h-12 w-12", title: "text-sm", desc: "text-xs", spacing: "gap-2 py-8" },
  md:  { icon: "h-6 w-6",   iconWrap: "h-14 w-14", title: "text-base", desc: "text-sm", spacing: "gap-3 py-12" },
  lg:  { icon: "h-8 w-8",   iconWrap: "h-20 w-20", title: "text-lg", desc: "text-sm",  spacing: "gap-4 py-16" },
};

const DefaultIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
  </svg>
);

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
  size = "md",
}: EmptyStateProps) {
  const s = sizes[size];
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center px-6",
        s.spacing,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex items-center justify-center rounded-2xl",
          "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500",
          s.iconWrap,
        ].join(" ")}
      >
        {icon ? (
          <span className={s.icon}>{icon}</span>
        ) : (
          <DefaultIcon className={s.icon} />
        )}
      </div>

      <div className="space-y-1 max-w-xs">
        <p className={[s.title, "font-semibold text-gray-800 dark:text-gray-200"].join(" ")}>
          {title}
        </p>
        {description && (
          <p className={[s.desc, "text-gray-500 dark:text-gray-400 leading-relaxed"].join(" ")}>
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
