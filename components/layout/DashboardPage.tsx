import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import clsx from 'clsx';

interface DashboardPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'default' | 'narrow' | 'medium';
  className?: string;
}

export default function DashboardPage({
  title,
  subtitle,
  children,
  size = 'default',
  className,
}: DashboardPageProps) {
  return (
    <div className="min-h-screen">
      <Header title={title} subtitle={subtitle} />
      <PageShell size={size} className={clsx('space-y-5', className)}>
        {children}
      </PageShell>
    </div>
  );
}
