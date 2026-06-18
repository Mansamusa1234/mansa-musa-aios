export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="h-8 w-24 rounded-lg bg-white/5" />

      {/* Profile card skeleton */}
      <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-5">
        <div className="h-5 w-20 rounded-lg bg-white/5" />
        <div className="space-y-3">
          <div>
            <div className="h-3.5 w-10 rounded bg-white/5 mb-1.5" />
            <div className="h-11 rounded-xl bg-white/5" />
          </div>
          <div>
            <div className="h-3.5 w-12 rounded bg-white/5 mb-1.5" />
            <div className="h-11 rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="h-10 w-28 rounded-xl bg-brand-500/20" />
      </div>

      {/* Security card skeleton */}
      <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
        <div className="h-5 w-24 rounded-lg bg-white/5" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div className="space-y-1">
              <div className="h-3.5 w-40 rounded bg-white/5" />
              <div className="h-3 w-56 rounded bg-white/4" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>

      {/* Sessions skeleton */}
      <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
        <div className="h-5 w-36 rounded-lg bg-white/5" />
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-white/3 p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/5" />
              <div className="space-y-1">
                <div className="h-3.5 w-32 rounded bg-white/5" />
                <div className="h-3 w-24 rounded bg-white/4" />
              </div>
            </div>
            <div className="h-7 w-16 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
