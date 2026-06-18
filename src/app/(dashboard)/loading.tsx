export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-white/5" />
          <div className="h-4 w-72 rounded-md bg-white/4" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-white/5" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/6 bg-white/4 p-5 space-y-3">
            <div className="h-3.5 w-20 rounded bg-white/5" />
            <div className="h-7 w-16 rounded-lg bg-white/6" />
            <div className="h-3 w-24 rounded bg-white/4" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
          <div className="h-5 w-32 rounded-lg bg-white/5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-1/2 rounded bg-white/4" />
              </div>
              <div className="h-3 w-12 rounded bg-white/4 shrink-0" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
          <div className="h-5 w-28 rounded-lg bg-white/5" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-white/4 p-4 space-y-2">
              <div className="h-3.5 w-2/3 rounded bg-white/5" />
              <div className="h-3 w-full rounded bg-white/4" />
              <div className="h-3 w-3/4 rounded bg-white/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
