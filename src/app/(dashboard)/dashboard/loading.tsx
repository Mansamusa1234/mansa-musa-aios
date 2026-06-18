export default function DashboardHomeLoading() {
  return (
    <div className="animate-pulse space-y-6 p-1">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-white/5" />
          <div className="h-4 w-48 rounded-md bg-white/4" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-white/5" />
      </div>

      {/* Onboarding checklist skeleton */}
      <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-3">
        <div className="h-5 w-40 rounded-lg bg-white/5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="h-5 w-5 rounded-full bg-white/5 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3.5 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/4" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-white/5 shrink-0" />
          </div>
        ))}
      </div>

      {/* Stats + recent conversations */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
            <div className="h-5 w-36 rounded-lg bg-white/5" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/3 rounded bg-white/5" />
                  <div className="h-3 w-1/3 rounded bg-white/4" />
                </div>
                <div className="h-3 w-16 rounded bg-white/4 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
            <div className="h-5 w-24 rounded-lg bg-white/5" />
            <div className="h-14 rounded-xl bg-white/4" />
            <div className="h-4 w-full rounded bg-white/4" />
            <div className="h-9 rounded-xl bg-brand-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
