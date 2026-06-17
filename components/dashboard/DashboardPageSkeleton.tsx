export default function DashboardPageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-5">
        <div className="h-7 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-64" />
      </div>
      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex gap-1 p-1 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex-1 h-10 bg-white rounded-lg" />
          <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
          <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
