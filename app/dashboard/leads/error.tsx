'use client';

import Button from '@/components/ui/Button';
import DashboardPage from '@/components/layout/DashboardPage';

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardPage
      title="Leads"
      subtitle="Something went wrong loading your inbox"
      size="medium"
    >
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-surface">
        <p className="text-sm text-muted-foreground">
          The leads page hit an unexpected error. Your captured leads are still saved — try reloading
          this page.
        </p>
        {error.message ? (
          <p className="mt-3 break-words font-mono text-[11px] text-rose-700">{error.message}</p>
        ) : null}
        <div className="mt-5 flex justify-center gap-2">
          <Button size="sm" onClick={() => reset()}>
            Try again
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.location.assign('/dashboard/leads')}>
            Reload page
          </Button>
        </div>
      </div>
    </DashboardPage>
  );
}
