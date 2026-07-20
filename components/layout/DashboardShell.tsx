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
        theme === 'light' && 'theme-light',
      )}
      data-theme={theme}
    >
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <div className="h-16 lg:hidden" />
        <main className="flex-1 overflow-y-auto bg-transparent">
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
