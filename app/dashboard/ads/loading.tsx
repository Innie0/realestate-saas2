import { Card } from '@/components/ui/Card';
import DashboardPage from '@/components/layout/DashboardPage';

export default function AdsLoading() {
  return (
    <DashboardPage title="Ads" subtitle="Manage Google Ads and Meta Ads campaigns from one place">
      <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
        {[1, 2].map((i) => (
          <Card key={i} className="p-5 sm:p-6">
            <div className="h-10 w-10 bg-gray-100 rounded-[10px] mb-3" />
            <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-50 rounded w-full" />
          </Card>
        ))}
      </div>
    </DashboardPage>
  );
}
