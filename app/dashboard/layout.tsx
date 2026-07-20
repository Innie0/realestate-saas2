// Dashboard layout - Layout for all dashboard pages
// Includes sidebar navigation for the agent workspace

import DashboardShell from '@/components/layout/DashboardShell';

/**
 * DashboardLayout component
 * Wraps all dashboard pages with sidebar navigation. No marketing chrome
 * (footer/legal links) — this is the agent workspace, not a marketing page.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
