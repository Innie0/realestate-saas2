// Dashboard layout - Layout for all dashboard pages
// Includes sidebar navigation for the agent workspace

import Sidebar from '@/components/layout/Sidebar';
import FeedbackWidget from '@/components/FeedbackWidget';
import DashboardProviders from '@/components/providers/DashboardProviders';

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
  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F3F2]">
      {/* Sidebar - fixed on the left side */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Add top padding on mobile for fixed header */}
        <div className="lg:hidden h-16" />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <DashboardProviders>{children}</DashboardProviders>
        </main>

        <FeedbackWidget />
      </div>
    </div>
  );
}

