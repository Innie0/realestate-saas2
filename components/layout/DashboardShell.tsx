'use client';

import clsx from 'clsx';
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
      className={clsx(
        'dashboard-root flex h-screen overflow-hidden bg-[var(--canvas)]',
        theme === 'light' ? 'theme-light' : 'theme-dark',
      )}
      data-theme={theme}
      suppressHydrationWarning
    >
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <div className="h-16 lg:hidden" />
        <main className="relative flex-1 overflow-y-auto bg-transparent">
          {theme === 'light' ? (
            <div className="dashboard-lined-bg pointer-events-none absolute inset-0 z-0" aria-hidden />
          ) : null}
          <div className="relative z-[1]">
            <DashboardProviders>{children}</DashboardProviders>
          </div>
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
