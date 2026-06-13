// Dashboard layout - Layout for all dashboard pages
// Includes sidebar navigation and consistent structure with dark theme

import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import FeedbackWidget from '@/components/FeedbackWidget';
import FeedbackFooterButton from '@/components/FeedbackFooterButton';

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
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
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
        
        <FeedbackWidget />

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
            <p>© 2026 Realestic. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <FeedbackFooterButton />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

