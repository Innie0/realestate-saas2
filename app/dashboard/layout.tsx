import DashboardShell from '@/components/layout/DashboardShell';
import { DASHBOARD_THEME_INIT_SCRIPT } from '@/lib/dashboard-theme';

/**
 * Dashboard layout — agent workspace shell (no marketing chrome).
 * Blocking theme script prevents a dark flash when light mode is stored.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DASHBOARD_THEME_INIT_SCRIPT }} />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
