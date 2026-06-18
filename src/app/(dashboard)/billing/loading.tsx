export default function BillingLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-white/5" />
      <div className="mt-1 h-4 w-72 rounded-md bg-white/4" />

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative flex flex-col rounded-2xl border border-white/6 bg-white/4 p-6 space-y-4">
            <div className="h-3 w-16 rounded bg-white/5" />
            <div className="h-8 w-20 rounded-lg bg-white/6" />
            <div className="flex-1 space-y-2">
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-white/5 shrink-0" />
                  <div className="h-3 w-full rounded bg-white/4" />
                </div>
              ))}
            </div>
            <div className="h-10 rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
