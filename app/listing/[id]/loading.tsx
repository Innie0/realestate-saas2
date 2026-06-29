export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] animate-pulse">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl bg-gray-200 aspect-[16/10]" />
        <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
