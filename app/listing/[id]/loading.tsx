export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] animate-pulse">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
          <div className="bg-gray-200 aspect-[16/9] md:aspect-[21/9]" />
          <div className="p-6 md:p-8 space-y-5">
            <div className="h-9 w-44 bg-gray-200 rounded" />
            <div className="flex gap-5 py-4 border-y border-gray-100">
              <div className="h-5 w-16 bg-gray-100 rounded" />
              <div className="h-5 w-16 bg-gray-100 rounded" />
              <div className="h-5 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-3/4 bg-gray-200 rounded" />
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-6 md:p-8 space-y-4">
          <div className="h-5 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-10 w-full bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
