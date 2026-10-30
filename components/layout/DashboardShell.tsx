'use client';

import Sidebar from '@/components/layout/Sidebar';
import FeedbackWidget from '@/components/FeedbackWidget';
import DashboardProviders from '@/components/providers/DashboardProviders';
import {
  DashboardThemeProvider,
  useDashboardTheme,
} from '@/components/providers/DashboardThemeProvider';
import { CommandPaletteProvider } from '@/components/search/CommandPalette';

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { theme } = useDashboardTheme();

  return (
    <div
      className="dashboard-root flex h-screen overflow-hidden bg-[var(--canvas)]"
      // Visible height on phones, so the bottom of each page isn't hidden behind the browser toolbar
      style={{ height: '100dvh' }}
      data-theme={theme}
      suppressHydrationWarning
    >
      <Sidebar />

      {/* min-w-0: without it, one long title or wide row stretches the whole page past a phone screen */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        <div className="h-16 lg:hidden" />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
          <DashboardProviders>{children}</DashboardProviders>
        </main>
        <FeedbackWidget />
      </div>
    </div>
  );
}

/** Client shell so dashboard theme can toggle light/dark without affecting marketing pages. */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <DashboardThemeProvider>
        <DashboardShellInner>{children}</DashboardShellInner>
      </DashboardThemeProvider>
    </CommandPaletteProvider>
  );
}
