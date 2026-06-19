export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6 max-w-6xl">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-white/5" />
        <div className="h-8 w-56 rounded-lg bg-white/6" />
        <div className="h-4 w-80 rounded bg-white/4" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-2xl border border-white/6 bg-white/4 p-4 space-y-2">
            <div className="h-6 w-14 rounded-lg bg-white/6" />
            <div className="h-3 w-20 rounded bg-white/4" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/5 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
