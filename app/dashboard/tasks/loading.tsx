import DashboardPage from '@/components/layout/DashboardPage';

export default function TasksLoading() {
  return (
    <DashboardPage title="AI Assistant" inline>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 h-[calc(100dvh-7.5rem)] min-h-[560px] animate-pulse">
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded-[10px] border border-gray-200" />
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[52px] bg-gray-50 rounded-[8px]" />
            ))}
          </div>
        </div>
        <div className="border border-gray-200 rounded-[10px] bg-white flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="w-14 h-14 rounded-full bg-gray-100" />
            <div className="h-6 w-56 bg-gray-100 rounded" />
            <div className="h-4 w-72 bg-gray-50 rounded" />
          </div>
          <div className="border-t border-gray-200 p-4">
            <div className="h-10 bg-gray-50 rounded-[10px]" />
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
