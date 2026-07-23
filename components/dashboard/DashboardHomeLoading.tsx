import DashboardPage from '@/components/layout/DashboardPage';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { DashboardHomeContentSkeleton } from '@/components/dashboard/DashboardHomeSkeletons';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Route + in-page loading shell — same layout as the live dashboard home. */
export default function DashboardHomeLoading() {
  return (
    <DashboardPage
      inline
      title={getGreeting()}
      subtitle={formatToday()}
      actions={
        <Link href="/dashboard/projects/new" data-tour="new-project">
          <Button size="sm" className="gap-2">
            New listing
            <span className="rounded bg-[var(--surface)]/[0.18] px-1 font-mono text-[10px] font-medium">N</span>
          </Button>
        </Link>
      }
    >
      <DashboardHomeContentSkeleton />
    </DashboardPage>
  );
}
