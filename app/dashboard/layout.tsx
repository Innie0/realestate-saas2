// Dashboard layout - Layout for all dashboard pages
// Includes sidebar navigation and consistent structure with dark theme

import Sidebar from '@/components/layout/Sidebar';

/**
 * DashboardLayout component
 * Wraps all dashboard pages with sidebar navigation and dark theme
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-950">
      {/* Sidebar - fixed on the left side */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable content with dark background */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}

