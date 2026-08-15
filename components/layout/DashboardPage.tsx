import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import PageTransition from '@/components/motion/PageTransition';
import clsx from 'clsx';

interface DashboardPageProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  size?: 'default' | 'narrow' | 'medium' | 'full';
  className?: string;
  /** Subtle background atmosphere for tool-style pages */
  ambient?: 'default' | 'tool';
  /** Baseline-aligned title + subtitle on one line, passed through to Header. */
  inline?: boolean;
  /** Lock page to the dashboard viewport (no document scroll; for tool split layouts). */
  fillViewport?: boolean;
}

const ambientClasses = {
  default: '',
  tool: 'dashboard-ambient-tool',
} as const;

export default function DashboardPage({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  size = 'default',
  className,
  ambient = 'default',
  inline = false,
  fillViewport = false,
}: DashboardPageProps) {
  return (
    <div
      className={clsx(
        'relative',
        fillViewport ? 'flex h-full min-h-0 flex-col overflow-hidden' : 'min-h-screen',
        ambientClasses[ambient],
      )}
    >
      <Header
        title={title}
        subtitle={subtitle}
        eyebrow={eyebrow}
        actions={actions}
        inline={inline}
        hero={!!eyebrow}
      />
      <PageShell size={size} className={clsx('relative z-[1]', fillViewport && 'flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
        <PageTransition
          className={clsx(
            fillViewport ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'space-y-5',
          )}
        >
          {children}
        </PageTransition>
      </PageShell>
    </div>
  );
}
