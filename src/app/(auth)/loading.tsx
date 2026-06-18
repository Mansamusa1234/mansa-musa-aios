export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#070712] px-4">
      <div className="w-full max-w-md animate-pulse space-y-4">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-white/5" />
          <div className="h-5 w-56 rounded-md bg-gray-200 dark:bg-white/4" />
        </div>
        <div className="rounded-2xl bg-white dark:bg-white/4 border border-gray-100 dark:border-white/6 p-8 space-y-4 shadow-card">
          <div className="space-y-2">
            <div className="h-3.5 w-10 rounded bg-gray-200 dark:bg-white/5" />
            <div className="h-11 rounded-xl bg-gray-100 dark:bg-white/5" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-16 rounded bg-gray-200 dark:bg-white/5" />
            <div className="h-11 rounded-xl bg-gray-100 dark:bg-white/5" />
          </div>
          <div className="h-11 rounded-xl bg-brand-100 dark:bg-brand-500/20" />
        </div>
      </div>
    </div>
  );
}
