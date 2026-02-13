// Dashboard layout - Layout for all dashboard pages
// Includes sidebar navigation and consistent structure with dark theme

import Link from 'next/link';
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
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar - fixed on the left side */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Add top padding on mobile for fixed header */}
        <div className="lg:hidden h-16" />
        
        {/* Scrollable content with dark background */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-800 bg-black px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
            <p>© 2026 Realestic. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
              <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

