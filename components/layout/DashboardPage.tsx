import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import PageTransition from '@/components/motion/PageTransition';
import clsx from 'clsx';

interface DashboardPageProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  size?: 'default' | 'narrow' | 'medium';
  className?: string;
  /** Subtle background atmosphere for tool-style pages */
  ambient?: 'default' | 'tool';
  /** Baseline-aligned title + subtitle on one line, passed through to Header. */
  inline?: boolean;
}

const ambientClasses = {
  default: '',
  tool: 'dashboard-ambient-tool',
} as const;

export default function DashboardPage({
  title,
  subtitle,
  actions,
  children,
  size = 'default',
  className,
  ambient = 'default',
  inline = false,
}: DashboardPageProps) {
  return (
    <div className={clsx('min-h-screen relative', ambientClasses[ambient])}>
      <Header title={title} subtitle={subtitle} actions={actions} inline={inline} />
      <PageShell size={size} className={clsx('relative z-[1]', className)}>
        <PageTransition className="space-y-5">{children}</PageTransition>
      </PageShell>
    </div>
  );
}
