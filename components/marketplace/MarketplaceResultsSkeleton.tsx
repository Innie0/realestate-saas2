export default function MarketplaceResultsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading properties">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="h-5 w-40 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-10 w-full sm:w-56 rounded-xl bg-gray-200 animate-pulse" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white overflow-hidden"
          >
            <div className="aspect-[16/10] bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
